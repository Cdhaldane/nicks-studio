const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration for different image sizes
const imageSizes = {
  thumbnail: 300,
  small: 640,
  medium: 1024,
  large: 1920,
  hero: 2560
};

async function optimizeImages() {
  console.log('🖼️  Starting image optimization...');
  
  const inputDir = './public';
  const outputDir = './public/optimized';
  
  // Create output directories
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  if (!fs.existsSync(`${outputDir}/webp`)) {
    fs.mkdirSync(`${outputDir}/webp`, { recursive: true });
  }

  try {
    const imageFiles = fs.readdirSync(inputDir).filter(file => 
      file.match(/\.(jpg|jpeg|png)$/i)
    );

    console.log(`📸 Found ${imageFiles.length} images to optimize...`);

    for (const file of imageFiles) {
      const inputPath = path.join(inputDir, file);
      const fileName = path.parse(file).name;
      const ext = path.parse(file).ext;
      
      console.log(`🔄 Processing ${file}...`);
      
      // Create optimized version at original size
      const optimizedPath = path.join(outputDir, file);
      await sharp(inputPath)
        .jpeg({ quality: 80, progressive: true })
        .toFile(optimizedPath);
      
      // Create different sizes
      for (const [sizeName, width] of Object.entries(imageSizes)) {
        // JPEG version
        const sizedOutputPath = path.join(outputDir, `${fileName}-${sizeName}${ext}`);
        await sharp(inputPath)
          .resize(width, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .jpeg({ quality: 80, progressive: true })
          .toFile(sizedOutputPath);
        
        // WebP version
        const webpOutputPath = path.join(outputDir, 'webp', `${fileName}-${sizeName}.webp`);
        await sharp(inputPath)
          .resize(width, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .webp({ quality: 80 })
          .toFile(webpOutputPath);
      }
      
      // Create WebP version at original size
      const webpPath = path.join(outputDir, 'webp', `${fileName}.webp`);
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(webpPath);
      
      console.log(`✅ Optimized ${file}`);
    }

    console.log('🎉 Image optimization complete!');
    console.log(`📁 Optimized images saved to: ${outputDir}`);
    
    // Display file size savings
    displaySavings(inputDir, outputDir);
    
  } catch (error) {
    console.error('❌ Error optimizing images:', error);
  }
}

function displaySavings(inputDir, outputDir) {
  console.log('\n📊 File Size Comparison:');
  console.log('─'.repeat(60));
  
  const inputFiles = fs.readdirSync(inputDir).filter(file => 
    file.match(/\.(jpg|jpeg|png)$/i)
  );
  
  let totalOriginal = 0;
  let totalOptimized = 0;
  
  inputFiles.forEach(file => {
    const originalPath = path.join(inputDir, file);
    const optimizedPath = path.join(outputDir, file);
    
    if (fs.existsSync(optimizedPath)) {
      const originalSize = fs.statSync(originalPath).size;
      const optimizedSize = fs.statSync(optimizedPath).size;
      const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
      
      totalOriginal += originalSize;
      totalOptimized += optimizedSize;
      
      console.log(`${file}:`);
      console.log(`  Original:  ${(originalSize / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`  Optimized: ${(optimizedSize / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`  Savings:   ${savings}%`);
      console.log('');
    }
  });
  
  const totalSavings = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(1);
  console.log('─'.repeat(60));
  console.log(`Total Original:  ${(totalOriginal / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Total Optimized: ${(totalOptimized / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Total Savings:   ${totalSavings}%`);
  console.log('─'.repeat(60));
}

// Run the optimization
if (require.main === module) {
  optimizeImages().catch(console.error);
}

module.exports = { optimizeImages };
