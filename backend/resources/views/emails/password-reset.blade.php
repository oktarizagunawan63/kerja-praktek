<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Password Akun Anda</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 8px;
        }
        .code-box {
            background: #fff;
            border: 2px solid #007bff;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            border-radius: 8px;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            color: #007bff;
            letter-spacing: 8px;
            font-family: monospace;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Reset Password Akun Anda</h2>
        
        <p>Halo,</p>
        
        <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
        
        <p>Gunakan kode berikut untuk melanjutkan proses reset password:</p>
        
        <div class="code-box">
            <strong>Kode Verifikasi:</strong><br>
            <div class="code">{{ $token }}</div>
        </div>
        
        <div class="warning">
            <strong>⚠️ Penting:</strong> Kode ini hanya berlaku selama 10 menit.
        </div>
        
        <p>Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini.</p>
        
        <p>Terima kasih.</p>
    </div>
</body>
</html>