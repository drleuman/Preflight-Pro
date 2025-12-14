/**
 * @license
 * Copyright 2025
 * SPDX-License-Identifier: Apache-2.0
 */

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const WebSocket = require('ws');
const { URLSearchParams, URL } = require('url');
const rateLimit = require('express-rate-limit');

const os = require('os');
const multer = require('multer');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

const app = express();
const port = process.env.PORT || 3000;

// -------- PDF fix endpoints (Ghostscript) --------
const uploadDir = path.join(os.tmpdir(), 'ppp-preflight');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) {}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safe = String(file.originalname || 'input.pdf').replace(/[^a-z0-9_.-]/gi, '_');
      cb(null, `${Date.now()}_${Math.random().toString(16).slice(2)}_${safe}`);
    },
  }),
  limits: { fileSize: 60 * 1024 * 1024 },
});

async function runGs(args) {
  // NOTE: `gs` must be installed in the runtime image.
  await execFileAsync('gs', args, { maxBuffer: 1024 * 1024 * 20 });
}

function safeUnlink(p) {
  if (!p) return;
  try { fs.unlinkSync(p); } catch (e) {}
}

function safeRmDir(dir) {
  if (!dir) return;
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}

function sendPdfAndCleanup(res, filePath, downloadName, cleanupFn) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    console.error('PDF stream error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to stream output PDF' });
    try { cleanupFn && cleanupFn(); } catch (e) {}
  });
  res.on('finish', () => { try { cleanupFn && cleanupFn(); } catch (e) {} });
  stream.pipe(res);
}

const externalApiBaseUrl = 'https://generativelanguage.googleapis.com';
const externalWsBaseUrl = 'wss://generativelanguage.googleapis.com';

// Soporta GEMINI_API_KEY o API_KEY
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

// Rutas de estáticos/build
const staticPath = path.join(__dirname, 'dist');   // salida de Vite
const publicPath = path.join(__dirname, 'public'); // (opcional) si luego quieres servir algo público

if (!apiKey) {
  // No detenemos el server; la app puede funcionar sin proxy
  console.warn('WARNING: GEMINI_API_KEY / API_KEY no configurada. El proxy a Gemini estará deshabilitado.');
} else {
  console.log('API KEY detectada: el proxy a Gemini usará esta clave.');
}

// -------- Middlewares base --------
app.set('trust proxy', 1);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// -------- Rate limit solo para /api-proxy --------
const proxyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}. Path: ${req.path}`);
    res.status(options.statusCode).send(options.message);
  },
});
app.use('/api-proxy', proxyLimiter);

// -------- Proxy HTTP a Gemini (/api-proxy/**) --------
app.use('/api-proxy', async (req, res, next) => {
  // Si es upgrade a WebSocket, dejamos que lo gestione el handler de upgrade
  if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
    return next();
  }

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*'); // ajusta si quieres restringir
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Goog-Api-Key');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.sendStatus(200);
  }

  if (!apiKey) {
    return res.status(503).json({ error: 'Proxy disabled: missing API key' });
  }

  try {
    // Construimos URL destino a partir de /api-proxy/<lo-que-sigue>
    const targetPath = req.url.startsWith('/') ? req.url.substring(1) : req.url;
    const apiUrl = `${externalApiBaseUrl}/${targetPath}`;
    // console.log(`HTTP Proxy => ${apiUrl}`);

    // Copiamos headers salvo los problemáticos
    const outgoingHeaders = {};
    for (const h in req.headers) {
      const low = h.toLowerCase();
      if (!['host', 'connection', 'content-length', 'transfer-encoding', 'upgrade', 'sec-websocket-key', 'sec-websocket-version', 'sec-websocket-extensions'].includes(low)) {
        outgoingHeaders[h] = req.headers[h];
      }
    }
    // Inyectamos API key correcta
    outgoingHeaders['X-Goog-Api-Key'] = apiKey;

    const method = req.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      outgoingHeaders['Content-Type'] = req.headers['content-type'] || 'application/json';
    } else {
      delete outgoingHeaders['Content-Type'];
      delete outgoingHeaders['content-type'];
    }
    if (!outgoingHeaders['accept']) outgoingHeaders['accept'] = '*/*';

    const axiosConfig = {
      method,
      url: apiUrl,
      headers: outgoingHeaders,
      responseType: 'stream',
      validateStatus: () => true,
      data: ['POST', 'PUT', 'PATCH'].includes(method) ? req.body : undefined,
    };

    const apiResponse = await axios(axiosConfig);

    // Passthrough headers/status
    for (const header in apiResponse.headers) {
      res.setHeader(header, apiResponse.headers[header]);
    }
    res.status(apiResponse.status);

    apiResponse.data.on('data', (chunk) => res.write(chunk));
    apiResponse.data.on('end', () => res.end());
    apiResponse.data.on('error', (err) => {
      console.error('Proxy stream error from upstream:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Proxy error during upstream streaming' });
      } else {
        res.end();
      }
    });
  } catch (error) {
    console.error('Proxy error before upstream:', error);
    if (!res.headersSent) {
      if (error.response) {
        res.status(error.response.status).json({
          status: error.response.status,
          message: error.response.data?.error?.message || 'Upstream error',
          details: error.response.data?.error?.details || null,
        });
      } else {
        res.status(500).json({ error: 'Proxy setup error', message: error.message });
      }
    }
  }
});


// -------- PDF fix routes --------
app.post('/api/convert/grayscale', upload.single('file'), async (req, res) => {
  const inputPath = req.file?.path;
  if (!inputPath) return res.status(400).json({ error: 'Missing file' });

  const baseName = path.basename(req.file.originalname || 'document.pdf').replace(/\.pdf$/i, '');
  const outName = `${baseName}_bw.pdf`;
  const outPath = path.join(uploadDir, `${Date.now()}_out_bw.pdf`);

  try {
    await runGs([
      '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dQUIET',
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/prepress',
      '-sColorConversionStrategy=Gray',
      '-dProcessColorModel=/DeviceGray',
      '-dOverrideICC',
      `-sOutputFile=${outPath}`,
      inputPath,
    ]);

    sendPdfAndCleanup(res, outPath, outName, () => {
      safeUnlink(inputPath);
      safeUnlink(outPath);
    });
  } catch (err) {
    console.error('grayscale conversion failed:', err);
    safeUnlink(inputPath);
    safeUnlink(outPath);
    res.status(500).json({ error: 'Grayscale conversion failed' });
  }
});

app.post('/api/convert/rgb-to-cmyk', upload.single('file'), async (req, res) => {
  const inputPath = req.file?.path;
  if (!inputPath) return res.status(400).json({ error: 'Missing file' });

  const baseName = path.basename(req.file.originalname || 'document.pdf').replace(/\.pdf$/i, '');
  const outName = `${baseName}_cmyk.pdf`;
  const outPath = path.join(uploadDir, `${Date.now()}_out_cmyk.pdf`);

  try {
    await runGs([
      '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dQUIET',
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/prepress',
      // Best-effort conversion (ICC-managed conversion requires profiles; this still forces CMYK device model)
      '-sColorConversionStrategy=CMYK',
      '-dProcessColorModel=/DeviceCMYK',
      '-dOverrideICC',
      `-sOutputFile=${outPath}`,
      inputPath,
    ]);

    sendPdfAndCleanup(res, outPath, outName, () => {
      safeUnlink(inputPath);
      safeUnlink(outPath);
    });
  } catch (err) {
    console.error('RGB->CMYK conversion failed:', err);
    safeUnlink(inputPath);
    safeUnlink(outPath);
    res.status(500).json({ error: 'RGB to CMYK conversion failed' });
  }
});

app.post('/api/convert/rebuild-150dpi', upload.single('file'), async (req, res) => {
  const inputPath = req.file?.path;
  if (!inputPath) return res.status(400).json({ error: 'Missing file' });

  const requested = Number(req.query?.dpi || 150);
  const dpi = Number.isFinite(requested) ? Math.min(600, Math.max(72, requested)) : 150;

  const baseName = path.basename(req.file.originalname || 'document.pdf').replace(/\.pdf$/i, '');
  const outName = `${baseName}_rebuild_${dpi}dpi.pdf`;
  const outPath = path.join(uploadDir, `${Date.now()}_out_rebuild_${dpi}.pdf`);

  // Render pages to images and rebuild a fresh PDF.
  const tmpDir = fs.mkdtempSync(path.join(uploadDir, 'rebuild_'));
  const imgPattern = path.join(tmpDir, 'page-%03d.png');

  try {
    // 1) rasterize
    await runGs([
      '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dQUIET',
      '-sDEVICE=png16m',
      `-r${dpi}`,
      '-o', imgPattern,
      inputPath,
    ]);

    // 2) rebuild PDF from images
    const imgs = fs
      .readdirSync(tmpDir)
      .filter((f) => /page-\d+\.png$/i.test(f))
      .sort()
      .map((f) => path.join(tmpDir, f));

    if (!imgs.length) {
      throw new Error('No images were produced during rebuild');
    }

    await runGs([
      '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dQUIET',
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-sOutputFile=${outPath}`,
      ...imgs,
    ]);

    sendPdfAndCleanup(res, outPath, outName, () => {
      safeUnlink(inputPath);
      safeUnlink(outPath);
      safeRmDir(tmpDir);
    });
  } catch (err) {
    console.error('rebuild dpi failed:', err);
    safeUnlink(inputPath);
    safeUnlink(outPath);
    safeRmDir(tmpDir);
    res.status(500).json({ error: 'Rebuild failed' });
  }
});

// -------- Estáticos de la app (build de Vite) --------
// Sirve /dist con MIME correcto para .mjs (pdf.worker.min-*.mjs)
app.use(
  express.static(staticPath, {
    setHeaders(res, filePath) {
      if (filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
    },
  })
);

// (opcional) Si necesitas exponer algo de /public
// app.use('/public', express.static(publicPath));

// Healthcheck simple
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// -------- SPA fallback --------
// Cualquier GET que no sea /api-proxy/** ni un archivo estático => index.html de /dist
app.get(/^\/(?!api-proxy\/).*/, (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// -------- WebSocket proxy a Gemini --------
const server = app.listen(port, () => {
  console.log(`Server listening on :${port}`);
  console.log(`HTTP proxy active at /api-proxy/**`);
});

const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const pathname = requestUrl.pathname;

    if (!pathname.startsWith('/api-proxy/')) {
      // No es para el proxy: rechazamos el upgrade
      socket.destroy();
      return;
    }

    if (!apiKey) {
      console.error('WS proxy: API key not configured. Closing connection.');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (clientWs) => {
      console.log('Client WebSocket connected to proxy for path:', pathname);

      const targetPathSegment = pathname.substring('/api-proxy'.length);
      const clientQuery = new URLSearchParams(requestUrl.search);
      clientQuery.set('key', apiKey);

      const targetGeminiWsUrl = `${externalWsBaseUrl}${targetPathSegment}?${clientQuery.toString()}`;
      // console.log('Connecting to upstream WS:', targetGeminiWsUrl);

      const geminiWs = new WebSocket(targetGeminiWsUrl, {
        protocol: request.headers['sec-websocket-protocol'],
      });

      const messageQueue = [];

      geminiWs.on('open', () => {
        // Vacía cola cuando abre
        while (messageQueue.length > 0) {
          const msg = messageQueue.shift();
          if (geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.send(msg);
          } else {
            messageQueue.unshift(msg);
            break;
          }
        }
      });

      geminiWs.on('message', (message) => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(message);
        }
      });

      geminiWs.on('close', (code, reason) => {
        if (clientWs.readyState === WebSocket.OPEN || clientWs.readyState === WebSocket.CONNECTING) {
          clientWs.close(code, reason.toString());
        }
      });

      geminiWs.on('error', (error) => {
        console.error('Upstream WS error:', error);
        if (clientWs.readyState === WebSocket.OPEN || clientWs.readyState === WebSocket.CONNECTING) {
          clientWs.close(1011, 'Upstream WebSocket error');
        }
      });

      clientWs.on('message', (message) => {
        if (geminiWs.readyState === WebSocket.OPEN) {
          geminiWs.send(message);
        } else if (geminiWs.readyState === WebSocket.CONNECTING) {
          messageQueue.push(message);
        } else {
          console.warn('Client sent message but upstream WS not open/connecting. Dropping.');
        }
      });

      clientWs.on('close', (code, reason) => {
        if (geminiWs.readyState === WebSocket.OPEN || geminiWs.readyState === WebSocket.CONNECTING) {
          geminiWs.close(code, reason.toString());
        }
      });

      clientWs.on('error', (error) => {
        console.error('Client WS error:', error);
        if (geminiWs.readyState === WebSocket.OPEN || geminiWs.readyState === WebSocket.CONNECTING) {
          geminiWs.close(1011, 'Client WebSocket error');
        }
      });
    });
  } catch (err) {
    console.error('WS upgrade handler error:', err);
    socket.destroy();
  }
});
