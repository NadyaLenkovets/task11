const tabsNavItems = document.querySelectorAll('.tab');
const tabsBlocks = document.querySelectorAll('.tabs__block');
const recentTab = document.getElementById('recent-tab');
const submitBtn = document.querySelector('.submit');
const allUploadsButton = document.getElementById('all-uploads');
const result = document.querySelector('.result');
const recentContent = document.querySelector('.recent__content');
const settingsButtons = document.querySelectorAll('.settings');
const uploadWindow = document.getElementById('upload-window');
const errorMessage = document.querySelector('.error-message')
const dragArea = document.getElementById('drag-area');




// ===========  табы  =========== 

tabsNavItems.forEach(onTabClick);

function onTabClick(item) {
   item.addEventListener("click", function() {
      
      let currentBtn = item;
      let tabID = currentBtn.getAttribute('data-tab');
      let currentTab = document.querySelector(tabID);

      if (!currentBtn.classList.contains('active')) {
         tabsNavItems.forEach(function(item) {
            item.classList.remove('active');
            
         });
   
         tabsBlocks.forEach(function(item) {
            item.classList.remove('active');
         });
   
         currentBtn.classList.add('active');
         currentTab.classList.add('active');
      }
   });
}

// сделать первый таб активным изначально не через html
document.querySelector('.tab:nth-child(1)').click();

recentTab.addEventListener('click', show5RecentFiles);



// ===========  drag and drop  =========== 

dragArea.addEventListener('dragenter', (e) => {
   e.preventDefault();
   e.stopPropagation();
   dragArea.classList.add('highlight');
})

dragArea.addEventListener('dragleave', (e) => {
   e.preventDefault();
   dragArea.classList.remove('highlight');
})

dragArea.addEventListener('dragover', (e) => {
   e.preventDefault();
   e.stopPropagation();
})

dragArea.addEventListener('drop', (e) => {
   e.stopPropagation();
   e.preventDefault();

   let dataTransfer = e.dataTransfer;
   let file = dataTransfer.files[0];

   uploadFileDragAndDrop(file);
})

// ===========  drag and drop end  =========== 





settingsButtons.forEach((settingsButton) => {
   settingsButton.addEventListener('click', function() {
      uploadWindow.classList.toggle('active');
   })
})

allUploadsButton.addEventListener('click', showAllRecentFiles);



function uploadFileDragAndDrop(file) {
      // создаем ссылку на корневую папку
   let storageRef = firebase.storage().ref();

   // создаем ссылку для загружемого файла
   let fileRef = storageRef.child('files/' + file.name); // берем имя файла из объекта

   // загружаем файл в storage
   fileRef.put(file)
   .then((snapshot) => {
      recentContent.innerHTML = '';
      document.querySelector('.tab:nth-child(2)').click();  // переключаем таб recent
      setFilesToDatabase(file); // добавляем инф о загруженном файле в database
      show5RecentFiles();
   })
   .catch((error) => {
      errorMessage.style.display = 'block';
      errorMessage.innerHTML = error.message; 
   });
}

function uploadFile() {
   const file = document.querySelector('.file').files[0];
      // создаем ссылку на корневую папку
   let storageRef = firebase.storage().ref();

   // создаем ссылку для загружемого файла
   let fileRef = storageRef.child('files/' + file.name); // берем имя файла из объекта

   // загружаем файл в storage
   fileRef.put(file)
   .then((snapshot) => {
      recentContent.innerHTML = '';
      snapshot.ref.getDownloadURL();
      document.querySelector('.tab:nth-child(2)').click();  // переключаем таб recent
      setFilesToDatabase(file); // добавляем инф о загруженном файле в database
      show5RecentFiles();
   })
   .catch((error) => {
      errorMessage.style.display = 'block';
      errorMessage.innerHTML = error.message;  
   });
}
  

function setFilesToDatabase(file) {
   firebase.firestore().collection("files").doc(file.name).set({
      name: file.name,
      size: file.size,
      timestamp: firebase.firestore.Timestamp.fromDate(new Date()),
   })
   .catch((error) => {
      errorMessage.style.display = 'block';
      errorMessage.innerHTML = error.message; 
   });
}




function show5RecentFiles() {
   // сортируем коллекцию 'files' по возрастанию времени с момента загрузки
   firebase.firestore().collection("files").orderBy("timestamp", "desc").get()
   .then((querySnapshot) => {
      const docSnapshots = querySnapshot.docs;

      recentContent.innerHTML = ''; // предварительно очищаем список файлов

      for (let i = 0; i < 5; i++) {
         const doc = docSnapshots[i];

         createFileHTMLElement(doc); // эта ф-ция добавляет на страницу HTML с инф об этом файле
      };
   });
};


function showAllRecentFiles() {
   // сортируем коллекцию 'files' по возрастанию времени с момента загрузки
   firebase.firestore().collection("files").orderBy("timestamp", "desc").get()
   .then((querySnapshot) => {
      recentContent.innerHTML = '';  // предварительно очищаем список файлов

      querySnapshot.forEach((doc) => {
         createFileHTMLElement(doc);
      });
   });
};


function createFileHTMLElement(doc) {
   let fileName = doc.data().name;
   let fileSize = checkFileSize(doc.data().size);
   let fileTime = getFileTime(doc); // получаем время от загрузки файла
   let fileTypeImage = checkFileTypeImage(fileName); // получаем картинку в зависимости от типа файла
   
   let fileTemplate = `
      <div class="recent-item">
         <div class="recent-item__icon">
            <img src="img/${fileTypeImage}" alt="">
         </div>
         <div class="recent-item__info">
            <div class="recent-item__name">${fileName}</div>
            <div class="recent-item__date">${fileTime}</div>
         </div>
         <div class="recent-item__size">${fileSize}</div>
         <div class="recent-item__dots">
            <img src="img/dots.svg" alt="dots">
         </div>
      </div>
   `;

   recentContent.insertAdjacentHTML('beforeend', fileTemplate);
}


function checkFileSize(fileSize) {
   if (fileSize/1000 > 1000) {
      return (fileSize/1000000).toFixed(2) + 'Mb';
   } else {
      return (fileSize/1000).toFixed(2) + 'Kb';
   }
}



function getFileTime(doc) {
   let now = new Date();
   let fileAddTime = doc.data().timestamp.toMillis( );
   let fileTime = Math.round((now.getTime() - fileAddTime) / (1000 * 60)); // получаем в минутах

   if (fileTime >= 60 && fileTime < 120) {
      fileTime = Math.round((now.getTime() - fileAddTime) / (1000 * 60 * 60)) + ' hour ago';
   } else if (fileTime >= 120 && fileTime < 1440) {
      fileTime = Math.round((now.getTime() - fileAddTime) / (1000 * 60 * 60)) + ' hours ago';
   } else if (fileTime >= 1440 && fileTime < 2880) {
      fileTime = Math.round((now.getTime() - fileAddTime) / (1000 * 60 * 60 * 24)) + ' day ago';
   } else if (fileTime >= 2880) {
      fileTime = Math.round((now.getTime() - fileAddTime) / (1000 * 60 * 60 * 24)) + ' days ago';
   } else if (fileTime == 0) {
      fileTime = '1 min ago';
   } else {
      fileTime = fileTime + ' min ago';
   }
   return fileTime;
}
   
     

function checkFileTypeImage(name) {
   //проверка картинки в зависимости от типа файла
   let fileTypeImage;
   let res;

   for (let i = 0; i < name.length; i++) {
      if (name[i] == '.') {
         res = name.slice(i+1);
      }
   }
   
   if (res == 'png' || res == 'jpg' || res == 'svg' || res == 'webp'  || res == 'jpeg' ) {
      fileTypeImage = 'image.svg';
   } else if (res == 'txt' || res == 'doc' || res == 'docx') {
      fileTypeImage = 'document.svg';
   } else if (res == 'pdf') {
      fileTypeImage = 'PDF.svg';
   } else {
      fileTypeImage = 'document.svg';
   }
   return fileTypeImage;
}
