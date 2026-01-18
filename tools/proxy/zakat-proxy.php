<?php
/**
 * IslamicAPI.com Proxy - XAMPP Version
 */

// Enable error reporting for XAMPP development
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// =============== XAMPP CONFIGURATION ===============
// GET YOUR NEW KEY FROM ISLAMICAPI.COM
$API_KEY = '1HmsIFcy3PEAdEWx7Jsk67j5jSxSnP6S0H5mXU2qVKL3Ssdq'; // ← REPLACE THIS!

// For XAMPP, use absolute path for cache
$CACHE_DIR = __DIR__ . '/cache/';
$CACHE_TIME = 21600; // 6 hours

// Supported currencies
$SUPPORTED_CURRENCIES = [
    'NGN', 'USD', 'EUR', 'GBP', 'SAR', 'AED', 
    'PKR', 'INR', 'MYR', 'IDR'
];

// =============== XAMPP HELPER FUNCTIONS ===============
function getCacheFilename($currency, $standard) {
    global $CACHE_DIR;
    $filename = $CACHE_DIR . 'nisab_' . strtolower($currency) . '_' . $standard . '.json';
    
    // For XAMPP Windows compatibility
    return str_replace('/', DIRECTORY_SEPARATOR, $filename);
}

function isCacheValid($cacheFile) {
    global $CACHE_TIME;
    return file_exists($cacheFile) && 
           (time() - filemtime($cacheFile)) < $CACHE_TIME;
}

function readCache($cacheFile) {
    if (!file_exists($cacheFile)) {
        error_log("Cache file not found: " . $cacheFile);
        return null;
    }
    
    $content = file_get_contents($cacheFile);
    if ($content === false) {
        error_log("Failed to read cache: " . $cacheFile);
        return null;
    }
    
    $data = json_decode($content, true);
    
    if ($data && isset($data['code'])) {
        $data['source'] = 'cache';
        $data['cached_at'] = date('c', filemtime($cacheFile));
    }
    
    return $data;
}

function writeCache($cacheFile, $data) {
    global $CACHE_DIR;
    
    // Create cache directory if it doesn't exist
    if (!is_dir($CACHE_DIR)) {
        if (!mkdir($CACHE_DIR, 0755, true)) {
            error_log("Failed to create cache directory: " . $CACHE_DIR);
            return false;
        }
    }
    
    $result = file_put_contents($cacheFile, json_encode($data, JSON_PRETTY_PRINT));
    
    if ($result === false) {
        error_log("Failed to write cache: " . $cacheFile);
        return false;
    }
    
    return true;
}

function calculateFallbackNisab($currency, $standard) {
    $standards = [
        'classical' => ['gold' => 87.48, 'silver' => 612.36],
        'common' => ['gold' => 85, 'silver' => 595]
    ];
    
    $goldPerGramUSD = 62.75;
    $silverPerGramUSD = 0.85;
    
    $exchangeRates = [
        'NGN' => 1300, 'USD' => 1, 'EUR' => 0.92, 'GBP' => 0.79,
        'SAR' => 3.75, 'AED' => 3.67, 'PKR' => 280, 'INR' => 83,
        'MYR' => 4.75, 'IDR' => 15500
    ];
    
    $weights = $standards[$standard] ?? $standards['classical'];
    $rate = $exchangeRates[$currency] ?? 1;
    
    $goldUnitPrice = $goldPerGramUSD * $rate;
    $silverUnitPrice = $silverPerGramUSD * $rate;
    
    return [
        'code' => 200,
        'status' => 'success',
        'calculation_standard' => $standard,
        'currency' => $currency,
        'weight_unit' => 'gram',
        'updated_at' => date('c'),
        'data' => [
            'nisab_thresholds' => [
                'gold' => [
                    'weight' => $weights['gold'],
                    'unit_price' => round($goldUnitPrice, 4),
                    'nisab_amount' => round($goldUnitPrice * $weights['gold'], 2)
                ],
                'silver' => [
                    'weight' => $weights['silver'],
                    'unit_price' => round($silverUnitPrice, 4),
                    'nisab_amount' => round($silverUnitPrice * $weights['silver'], 2)
                ]
            ],
            'zakat_rate' => '2.5%',
            'notes' => 'Fallback calculation - API unavailable'
        ],
        'source' => 'fallback',
        'xampp_debug' => 'Using fallback calculation'
    ];
}

// =============== MAIN LOGIC ===============
try {
    // Get parameters
    $currency = isset($_GET['currency']) ? strtoupper(trim($_GET['currency'])) : 'NGN';
    $standard = isset($_GET['standard']) ? trim($_GET['standard']) : 'classical';
    
    // Log request for debugging
    error_log("XAMPP Request: currency=$currency, standard=$standard");
    
    // Validate
    if (!in_array($currency, $SUPPORTED_CURRENCIES)) {
        $currency = 'NGN';
    }
    
    if (!in_array($standard, ['classical', 'common'])) {
        $standard = 'classical';
    }
    
    // Check cache
    $cacheFile = getCacheFilename($currency, $standard);
    
    if (isCacheValid($cacheFile)) {
        $data = readCache($cacheFile);
        if ($data) {
            $data['xampp_debug'] = 'Served from cache';
            echo json_encode($data);
            exit;
        }
    }
    
    // Fetch from IslamicAPI
    $apiUrl = "https://islamicapi.com/api/v1/zakat-nisab/";
    $queryParams = http_build_query([
        'standard' => $standard,
        'currency' => strtolower($currency),
        'unit' => 'g',
        'api_key' => $API_KEY
    ]);
    
    $fullUrl = $apiUrl . '?' . $queryParams;
    error_log("Calling IslamicAPI: " . $fullUrl);
    
    // Use file_get_contents if curl not available in XAMPP
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $fullUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
    } else {
        // Fallback for XAMPP without curl
        $context = stream_context_create([
            'http' => ['timeout' => 10],
            'ssl' => ['verify_peer' => false, 'verify_peer_name' => false]
        ]);
        $response = @file_get_contents($fullUrl, false, $context);
        $httpCode = $response !== false ? 200 : 500;
    }
    
    if ($response && $httpCode === 200) {
        $data = json_decode($response, true);
        
        if ($data && isset($data['code']) && $data['code'] === 200) {
            // Cache successful response
            writeCache($cacheFile, $data);
            
            $data['source'] = 'islamicapi';
            $data['cached_at'] = date('c');
            $data['xampp_debug'] = 'Fresh from IslamicAPI';
            
            echo json_encode($data);
            exit;
        } else {
            error_log("IslamicAPI returned error: " . json_encode($data));
        }
    }
    
    throw new Exception("IslamicAPI request failed. HTTP Code: $httpCode");
    
} catch (Exception $e) {
    error_log("Exception in proxy: " . $e->getMessage());
    
    // Use fallback
    $fallbackData = calculateFallbackNisab($currency, $standard);
    writeCache($cacheFile, $fallbackData);
    
    echo json_encode($fallbackData);
    exit;
}
?>