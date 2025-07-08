const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createFavicons() {
  console.log('🎨 Creating favicon files...');
  
  const inputImage = './public/nick-bio.jpg';
  const outputDir = './public';
  
  if (!fs.existsSync(inputImage)) {
    console.error('❌ Source image not found:', inputImage);
    return;
  }

  try {
    // Create various favicon sizes
    const sizes = [16, 32, 48, 64, 128, 180, 192, 512];
    
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `favicon-${size}.png`);
      
      await sharp(inputImage)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png({ quality: 90 })
        .toFile(outputPath);
      
      console.log(`✅ Created ${size}x${size} favicon`);
    }
    
    // Create standard favicon.ico (32x32)
    await sharp(inputImage)
      .resize(32, 32, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile('./public/favicon-temp.png');
    
    // Create apple-touch-icon (180x180)
    await sharp(inputImage)
      .resize(180, 180, {
        fit: 'cover',
        position: 'center'
      })
      .png({ quality: 90 })
      .toFile('./public/apple-touch-icon.png');
    
    console.log('✅ Created apple-touch-icon.png');
    
    // Create large icon for Android/PWA (512x512)
    await sharp(inputImage)
      .resize(512, 512, {
        fit: 'cover',
        position: 'center'
      })
      .png({ quality: 90 })
      .toFile('./public/icon-512.png');
    
    console.log('✅ Created icon-512.png');
    
    console.log('🎉 Favicon generation complete!');
    console.log('📋 Don\'t forget to:');
    console.log('   1. Convert favicon-temp.png to favicon.ico');
    console.log('   2. Update manifest.json with new icon references');
    
  } catch (error) {
    console.error('❌ Error creating favicons:', error);
  }
}

// Run the favicon generation
if (require.main === module) {
  createFavicons().catch(console.error);
}

module.exports = { createFavicons };
