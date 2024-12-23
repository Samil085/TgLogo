const { Telegraf } = require('telegraf');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Bot tokeninizi buraya girin
const bot = new Telegraf('5016208704:AAGo_ouiqmppOYDxpW9R8tM5on5-x156bPE');

// Logo dosyasının yolu
const logoPath = path.join(__dirname, 'logo.png');

// Fotoğraf geldiğinde işleme
bot.on('photo', async (ctx) => {
    try {
        // Fotoğrafın en yüksek çözünürlüklü versiyonunu al
        const photo = ctx.message.photo.pop();
        const fileId = photo.file_id;

        // Telegram'dan fotoğraf dosyasını al
        const fileLink = await ctx.telegram.getFileLink(fileId);
        const response = await fetch(fileLink);
        const buffer = await response.arrayBuffer();

        // Sharp ile fotoğrafın boyutunu öğren
        const image = sharp(Buffer.from(buffer));
        const metadata = await image.metadata();

        // Logonun boyutunu fotoğrafın boyutuna göre ayarla (örneğin, fotoğrafın %10'u boyutunda)
        const logoBuffer = fs.readFileSync(logoPath);
        const resizedLogo = await sharp(logoBuffer)
            .resize({
                width: Math.floor(metadata.width * 0.2), // Fotoğrafın genişliğinin %10'u
                height: Math.floor(metadata.height * 0.2), // Fotoğrafın yüksekliğinin %10'u
                fit: 'inside',
            })
            .toBuffer();

        // Fotoğrafa logoyu ekle
        const processedImage = await image
            .composite([
                {
                    input: resizedLogo,
                    top: 10, // Logonun yukarıdaki konumu
                    left: 10, // Logonun soldaki konumu
                },
            ])
            .toBuffer();

        // İşlenmiş fotoğrafı yüksek kaliteyle geri gönder (JPEG formatında kalite koruma)
        const finalImage = await sharp(processedImage)
            .jpeg({ quality: 100 }) // Kaliteyi %100'e ayarla
            .toBuffer();

        // İşlenmiş fotoğrafı geri gönder
        await ctx.replyWithPhoto({ source: finalImage });
    } catch (error) {
        console.error('Fotoğraf işlenirken bir hata oluştu:', error);
        ctx.reply('Fotoğraf işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
});


// Botu başlat
bot.launch().then(() => {
    console.log('Bot çalışıyor!');
});

// SIGINT ve SIGTERM sinyalleri için botu durdur
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));