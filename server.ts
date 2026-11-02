import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { INITIAL_ZONES, INITIAL_SCHEMES } from './src/data/initialData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// Persistent Campaign Data Storage Directory
const DATA_DIR = path.resolve(__dirname, 'server_data');
const ZONES_FILE = path.join(DATA_DIR, 'campaign_zones.json');
const SCHEMES_FILE = path.join(DATA_DIR, 'campaign_schemes.json');
const META_FILE = path.join(DATA_DIR, 'campaign_meta.json');

// Ensure storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory state backed by disk storage
let serverZones: any[] = [];
let serverSchemes: any[] = [];
let serverVersion = 1;
let serverLastUpdated = new Date().toISOString();
let serverCustomAdminPassword = '';

// Load initial data from disk or fallback to baseline
try {
  if (fs.existsSync(ZONES_FILE)) {
    const raw = fs.readFileSync(ZONES_FILE, 'utf-8');
    serverZones = JSON.parse(raw);
  } else {
    serverZones = INITIAL_ZONES;
    fs.writeFileSync(ZONES_FILE, JSON.stringify(serverZones, null, 2), 'utf-8');
  }

  if (fs.existsSync(SCHEMES_FILE)) {
    const raw = fs.readFileSync(SCHEMES_FILE, 'utf-8');
    serverSchemes = JSON.parse(raw);
  } else {
    serverSchemes = INITIAL_SCHEMES;
    fs.writeFileSync(SCHEMES_FILE, JSON.stringify(serverSchemes, null, 2), 'utf-8');
  }

  if (fs.existsSync(META_FILE)) {
    const raw = fs.readFileSync(META_FILE, 'utf-8');
    const meta = JSON.parse(raw);
    serverVersion = meta.version || 1;
    serverLastUpdated = meta.lastUpdated || new Date().toISOString();
    serverCustomAdminPassword = meta.customAdminPassword || '';
  } else {
    fs.writeFileSync(
      META_FILE,
      JSON.stringify(
        {
          version: serverVersion,
          lastUpdated: serverLastUpdated,
          customAdminPassword: serverCustomAdminPassword,
        },
        null,
        2
      ),
      'utf-8'
    );
  }
} catch (err) {
  console.error('Error initializing server campaign storage:', err);
  serverZones = INITIAL_ZONES;
  serverSchemes = INITIAL_SCHEMES;
}

function persistMeta() {
  try {
    fs.writeFileSync(
      META_FILE,
      JSON.stringify(
        {
          version: serverVersion,
          lastUpdated: serverLastUpdated,
          customAdminPassword: serverCustomAdminPassword,
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch (err) {
    console.error('Failed to persist metadata file:', err);
  }
}

// =========================================================================
// CAMPAIGN DATA REST ENDPOINTS (MULTI-DEVICE & CROSS-BROWSER SYNCHRONIZATION)
// =========================================================================

// 1. Fetch Full Shared Campaign Data
app.get('/api/campaign/data', (req, res) => {
  res.json({
    success: true,
    zones: serverZones,
    schemes: serverSchemes,
    version: serverVersion,
    lastUpdated: serverLastUpdated,
  });
});

// 2. Persist Updated Zones (from Admin Live Editor, CSV Upload, or Kobo Sync)
app.post('/api/campaign/zones', (req, res) => {
  try {
    const { zones } = req.body;
    if (!Array.isArray(zones) || zones.length === 0) {
      return res.status(400).json({ success: false, error: 'Expected non-empty zones array' });
    }
    serverZones = zones;
    serverVersion++;
    serverLastUpdated = new Date().toISOString();
    fs.writeFileSync(ZONES_FILE, JSON.stringify(serverZones, null, 2), 'utf-8');
    persistMeta();
    console.log(`[Campaign Sync] Updated ${serverZones.length} zones. Version: ${serverVersion}`);
    res.json({
      success: true,
      version: serverVersion,
      lastUpdated: serverLastUpdated,
      count: serverZones.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Persist Updated Schemes
app.post('/api/campaign/schemes', (req, res) => {
  try {
    const { schemes } = req.body;
    if (!Array.isArray(schemes)) {
      return res.status(400).json({ success: false, error: 'Expected schemes array' });
    }
    serverSchemes = schemes;
    serverVersion++;
    serverLastUpdated = new Date().toISOString();
    fs.writeFileSync(SCHEMES_FILE, JSON.stringify(serverSchemes, null, 2), 'utf-8');
    persistMeta();
    console.log(`[Campaign Sync] Updated ${serverSchemes.length} schemes. Version: ${serverVersion}`);
    res.json({
      success: true,
      version: serverVersion,
      lastUpdated: serverLastUpdated,
      count: serverSchemes.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Lightweight Server Polling Status
app.get('/api/campaign/status', (req, res) => {
  res.json({
    success: true,
    version: serverVersion,
    lastUpdated: serverLastUpdated,
    zonesCount: serverZones.length,
    schemesCount: serverSchemes.length,
  });
});

// 5. Reset to Bureau Baseline Dataset
app.post('/api/campaign/reset', (req, res) => {
  try {
    serverZones = INITIAL_ZONES;
    serverSchemes = INITIAL_SCHEMES;
    serverVersion++;
    serverLastUpdated = new Date().toISOString();
    fs.writeFileSync(ZONES_FILE, JSON.stringify(serverZones, null, 2), 'utf-8');
    fs.writeFileSync(SCHEMES_FILE, JSON.stringify(serverSchemes, null, 2), 'utf-8');
    persistMeta();
    console.log(`[Campaign Sync] Reset to baseline dataset. Version: ${serverVersion}`);
    res.json({
      success: true,
      version: serverVersion,
      lastUpdated: serverLastUpdated,
      message: 'Reset to Bureau baseline dataset successfully',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Admin Password Sync (Shared Across All Devices)
app.get('/api/campaign/admin-pwd', (req, res) => {
  res.json({
    success: true,
    customPassword: serverCustomAdminPassword || null,
  });
});

app.post('/api/campaign/admin-pwd', (req, res) => {
  try {
    const { password } = req.body;
    if (typeof password === 'string' && password.length >= 6) {
      serverCustomAdminPassword = password;
      persistMeta();
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: 'Password too short' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// KOBO TOOLBOX API PROXY ROUTE
// =========================================================================
app.post('/api/kobo/sync', async (req, res) => {
  const { koboUrl = 'https://kf.kobotoolbox.org', username = 'oboa2026', password = 'Oboa@2019', assetUid, syncAll = false } = req.body;
  try {
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    
    // Always fetch asset list to get live deployed forms
    const assetsResp = await fetch(`${koboUrl.replace(/\/+$/, '')}/api/v2/assets.json`, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    let liveAssets: any[] = [];
    if (assetsResp.ok) {
      const assetsData = await assetsResp.json();
      liveAssets = assetsData?.results || [];
    }

    // If syncAll is true or assetUid === 'ALL', fetch data from all 8 survey assets
    if (syncAll || assetUid === 'ALL') {
      const allSubmissions: Record<string, any[]> = {};
      let totalSubmissionsCount = 0;

      await Promise.all(
        liveAssets.map(async (asset: any) => {
          try {
            const subResp = await fetch(`${koboUrl.replace(/\/+$/, '')}/api/v2/assets/${asset.uid}/data.json`, {
              headers: { Authorization: authHeader, Accept: 'application/json' },
            });
            if (subResp.ok) {
              const subData = await subResp.json();
              allSubmissions[asset.uid] = subData?.results || [];
              totalSubmissionsCount += subData?.count || (subData?.results?.length ?? 0);
            }
          } catch (e) {
            console.error(`Error fetching data for asset ${asset.uid}:`, e);
          }
        })
      );

      return res.json({
        success: true,
        isAllSync: true,
        assets: liveAssets,
        submissionsByAsset: allSubmissions,
        totalCount: totalSubmissionsCount,
        message: `Successfully synchronized all ${liveAssets.length} Kobo forms with ${totalSubmissionsCount} total field records.`,
      });
    }

    // If no specific assetUid provided and not syncAll, return asset list
    if (!assetUid) {
      return res.json({
        success: true,
        count: liveAssets.length,
        assets: liveAssets,
      });
    }

    // Fetch submissions for a specific assetUid
    const resp = await fetch(`${koboUrl.replace(/\/+$/, '')}/api/v2/assets/${assetUid}/data.json`, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    if (!resp.ok) {
      return res.status(resp.status).json({
        success: false,
        statusText: resp.statusText,
        message: `KoboToolbox data API responded with status ${resp.status}`,
        fallbackToMock: true,
      });
    }

    const data = await resp.json();
    return res.json({
      success: true,
      submissions: data?.results || [],
      count: data?.count || (data?.results?.length ?? 0),
      assets: liveAssets,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
      fallbackToMock: true,
    });
  }
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Oromia BOA Wheat Analytics Server',
    version: serverVersion,
    lastUpdated: serverLastUpdated,
    time: new Date().toISOString(),
  });
});

// Setup Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Oromia BOA Wheat Analytics Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
