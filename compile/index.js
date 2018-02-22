const fs = require("fs")
const path = require("path")
const sizeOf = require('image-size');
const needle = require('needle')
const md5 = require('nodejs-md5');
const jsonfile = require('jsonfile')
  
const root = path.join(__dirname, '../photo/')
const target = path.join(__dirname, '../data.json')
  
// readDirSync(root)
function readDirSync(dir) {
  const pa = fs.readdirSync(dir);
  pa.forEach(function(ele, index) {  
    const info = fs.statSync(dir + "/" + ele)
    if (info.isDirectory()) {
      console.log("dir: " + ele)  
      readDirSync(dir + "/" + ele);  
    } else {
      if (!ele.startsWith('.')) {
        console.log("file: "+ele)
      }
    }   
  })  
}

async function readGalleries(root, lastData) {
  const lastDataMap = {}
  const result = []
  const f = fs.readdirSync(root);

  lastData.forEach(d => {
    lastDataMap[d.date] = d.data
    d.data.imagesMap = {}
    d.data.images.forEach(img => d.data.imagesMap[img.name] = img)
  });
  
  for (let i = 0; i < f.length; i++) {
    const name = f[i];
    const currentPath = root + "/" + name
    const info = fs.statSync(currentPath)
    if (info.isDirectory()) {
      let data = await readGallery(currentPath, lastDataMap[name])
      result.push({
        date: name,
        data
      })
    }
  }
  return result
}

async function readGallery(galleryPath, lastData) {
  const f = fs.readdirSync(galleryPath);
  const data = {
    images: []
  }
  for (let i = 0; i < f.length; i++) {
    const name = f[i];
    const currentPath = galleryPath + "/" + name
    const info = fs.statSync(currentPath)

    if (!info.isDirectory() && !name.startsWith('.')) {
      if (/.*(jpg|png|jpeg|gif)$/i.test(name)) {
        const imageMd5 = await getFileMd5(currentPath)
        
        if (lastData && imageMd5 === lastData.imagesMap[name].md5) {
          data.images.push(lastData.imagesMap[name])
        } else {
          const dimensions = sizeOf(currentPath);
          console.info('uploading file', name)
          try {
            const url = await uploadImage(currentPath)
            data.images.push({
              name,
              md5: imageMd5,
              url,
              width: dimensions.width,
              height: dimensions.height
            })
          } catch (error) {
           console.error('add image failed.', name) 
          }
        }
      } else if (/.*(txt)$/i.test(name)) {
        const desc = fs.readFileSync(currentPath, 'utf-8').split('\n')
        data.title = desc.shift();
        data.detail = desc.join('\n')
      }
    }
  }
  return data
}

function uploadImage(filePath) {
  return new Promise(function (resolve, reject) {
    var data = {
      callback: 'callback',
      upload: { file: filePath, content_type: 'image/jpeg' }
    }
    needle.post('https://file-dd.jd.com/file/uploadImg.action', data, { multipart: true }, function(err, resp, body) {
      if (err || !body) {
        return reject(err)
      }
      const reg = body.match(/path":"([^"]*)"/)
      if (reg && reg.length) {
        resolve(reg[1])
      } else {
        reject(body)
      }
    });
  });
}

function getFileMd5(filePath) {
  return new Promise(function (resolve, reject) {
    md5.file.quiet(filePath, function(err, md5) {
      if (err) {
        reject(err)
      } else {
        resolve(md5)
      }
    });
  });
}

// async function start(params) {
//   // let mm = await getFileMd5("/Users/even/Dev/uflywu/photo/20180220/IMG_20180220_104616_meitu.jpg")
//   // console.info(mm)

//   let url = await uploadImage('/Users/even/Dev/uflywu/photo/20180220/IMG_20180220_104616_meitu.jpg')
//   console.info(url)
// }
// start()

function launch() {
  jsonfile.readFile(target, function(err, data) {
    start(data);
  })

  async function start(data) {
    const lastData = data || []
    const result = await readGalleries(root, lastData)
    // console.info(JSON.stringify(result))
    fs.writeFile(target, JSON.stringify(result), function(err) {
      if(err) {
          return console.log(err);
      }
      console.log("build successed!");
    });
  }
}

launch()
