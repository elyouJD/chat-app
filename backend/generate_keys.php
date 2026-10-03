<?php

echo "OpenSSL: " . (extension_loaded('openssl') ? 'OK' : 'NO') . PHP_EOL;

$key = openssl_pkey_new([
    'private_key_type' => OPENSSL_KEYTYPE_RSA,
    'private_key_bits' => 2048,
]);

if ($key === false) {
    echo "KEY ERROR:" . PHP_EOL;
    while ($error = openssl_error_string()) {
        echo $error . PHP_EOL;
    }
    exit(1);
}

echo "KEY CREATED!" . PHP_EOL;

openssl_pkey_export($key, $private);

$details = openssl_pkey_get_details($key);

if ($private === false || $details === false) {
    echo "EXPORT ERROR:" . PHP_EOL;
    while ($error = openssl_error_string()) {
        echo $error . PHP_EOL;
    }
    exit(1);
}

file_put_contents(__DIR__ . '/config/jwt/private.pem', $private);
file_put_contents(__DIR__ . '/config/jwt/public.pem', $details['key']);

echo "JWT keys generated successfully!" . PHP_EOL;
