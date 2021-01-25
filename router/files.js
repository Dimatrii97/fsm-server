const express = require('express');
const router = express.Router();

const fse = require('fs-extra');

const { v4: uuidv4 } = require('uuid');

//Вынос

const sizing = ['б', 'Кб', 'Mб', 'Гб'];

const formats = {
  musicFormat: {
    type: ['.mp3', '.aac', '.wac'],
    typeRu: 'Музыка',
    icon: 'music',
  },
  videoFormat: {
    type: ['.avi', '.mpg', '.mp4'],
    typeRu: 'Видео',
    icons: 'video',
  },
  textFromat: {
    type: ['.docx', '.excel'],
    typeRu: 'Документ',
    icons: 'textfile',
  },
  executableFromat: {
    type: ['.exe', '.com', '.bat'],
    typeRu: 'Приложение',
    icons: 'executable',
  },
};

function formatting(bit) {
  for (let i = 0; i < sizing.length; i++) {
    if (bit / 1024 >= 1) {
      bit = bit / 1024;
    } else {
      return `${bit.toFixed(1).replace(/.0/, '')} ${sizing[i]}`;
    }
  }
}

async function getInfoFile(dir, name) {
  try {
    const access = await fse.access(
      dir,
      fse.constants.R_OK && fse.constants.W_OK && fse.constants.F_OK
    );
    const stat = await fse.stat(dir).then((el) => {
      const iconPath = 'http://localhost:5000/';
      let filterState = {};
      filterState.id = uuidv4();
      filterState.time = el.mtime;
      filterState.name = name;

      if (el.isDirectory()) {
        filterState.type = 'directory';
        filterState.typeRu = 'Папка с файлами';
        filterState.icon = iconPath + 'directory.png';
      } else {
        filterState.size = formatting(el.size);
        const typeFile = name.match(/\.\w*$/)[0];
        filterState.type = typeFile;
        for (const key in formats) {
          if (formats[key].type.includes(typeFile)) {
            filterState.icon = iconPath + formats[key].icons + '.png';
            filterState.typeRu = formats[key].typeRu;
            break;
          } else {
            filterState.icon = iconPath + 'file-default.png';
            filterState.typeRu = filterState.type.slice(1);
          }
        }
      }

      return filterState;
    });
    return stat;
  } catch (error) {
    return Promise.resolve(null);
  }
}
//Вынос
router.post('/api/copy', async (req, res) => {
  let { movment, destination, force } = req.body;
  const newFileName = movment.split('\\').pop();
  const endPath = `${destination}\\${newFileName}`;
  try {
    if (!force) {
      const isFile = await fse.pathExists(endPath);
      if (isFile) {
        res
          .status(409)
          .json({
            res: false,
            message: {
              title: 'Конфликт файлов',
              text: 'Файл с таким названием уже существует. Возможно перезапись файлов',
            },
            force,
          });
        return;
      }
    }

    fse
      .copy(movment, endPath)
      .then(() => res.json({ res: true }))
      .catch((err) => {
        res.json({ res: false, message: 'Не возможно скопировать файл' });
      });
  } catch (error) {
    res.json({ res: false, message: 'Нет возможности записать файл' });
  }
});

router.post('/api/move', async (req, res) => {
  let { movment, destination, force } = req.body;
  const newFileName = movment.split('\\').pop();
  const endPath = `${destination}\\${newFileName}`;

  try {
    if (!force) {
      const isFile = await fse.pathExists(endPath);
      if (isFile) {
        res
          .status(409)
          .json({
            res: false,
            message: {
              title: 'Конфликт файлов',
              text: 'Файл с таким названием уже существует. Возможно перезапись файлов',
            },
            force,
          });
        return;
      }
    }
    fse.move(movment, endPath)
      .then(() => {
        res.json({ res: true });
      })
      .catch((err) => {
        res.json({ res: false, message: 'Не возможно скопировать файл' });
      });
  } catch (error) {
    res.json({ res: false, message: 'Нет возможности записать файл' });
  }
});
router.delete('/api/delete', async (req, res) => {
  fse.remove(req.body.path)
    .then(() => {
      res.json({ res: true });
    })
    .catch((err) => {
      res.json({ res: false, message: 'Не возможно удалить файл' });
    });
});

router.get('/api/file', async (req, res) => {
  const { path } = req.query;
  if (path) {
    try {
      const access = await fse.access(
        path,
        fse.constants.R_OK && fse.constants.W_OK && fse.constants.F_OK
      );
      const filesName = fse.readdirSync(path);
      const filesInfo = await Promise.all(
        filesName.map((el) => {
          return getInfoFile(path + `/${el}`, el);
        })
      );
      const data = filesInfo.filter((el) => el);
      res.json({ res: true, data, path });
    } catch (error) {
      res
        .status(400)
        .json({ res: false, message: 'Нет доступа к файлу или папке' });
    }
  } else {
    res.status(403).json({ res: false, message: 'Запрос не содержит пути' });
  }
});

router.get('/api/directories', (req, res) => {
  const exec = require('child_process').exec;
  exec('wmic logicaldisk get name', (error, stdout, stderr) => {
    if (error) {
      res
        .status(400)
        .json({ res: false, message: 'нет доступа к корневому катологу' });
      return;
    }
    const roots = stdout.match(/\w*:/g).map((el) => (el += '\\'));
    res.json({ res: true, roots });
  });
});


module.exports = router;
