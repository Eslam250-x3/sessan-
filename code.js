// --- CONFIGURATION ---
const CONFIG = {
UI: {
  MENU_TITLE:   '📥  استيراد  HTML',
  IMPORT_ITEM:   ' فتح   واجهة   الاستيراد ',
  DIALOG_TITLE:   ' مستورد   الشرائح   التفاعلي ',
  DIALOG_WIDTH: 2000,
  DIALOG_HEIGHT: 2000,
  TITLE_FILL_COLOR: '#0B5FA5',
  TITLE_FONT_COLOR: '#FFFFFF',
},
LAYOUT: {
  ID_BOX_FILL_COLOR: '#f3f4f6',
  ID_BOX_BORDER_COLOR: '#d1d5db',
  ID_BOX_FONT_COLOR: '#000000', // Black for keys
  ID_BOX_VALUE_FONT_COLOR: '#FF0000', // Red for values
  QUESTION_CONTENT_TOP: 80,
},
REGEX: {
  DRIVE_FILE_ID: /[-\w]{25,}/,
  SLIDE_SECTION: /<section class="col-12">([\s\S]*?)<\/section>/g,
  TITLE_TEXT: /<div class="question-number.*?"><p>([\s\S]*?)<\/p><\/div>/,
  IMAGE_SRC: /<img.*?src=["'](?:static\/)?(.*?\.[\w]+)["']/,
  QUESTION_BODY: /<div class="stem"[^>]*>([\s\S]*?)(?:<div class="answers">|<ul class="mcq_choices">)/,
  ANSWER_OPTIONS: /<li[^>]*>(?:<span class="not_active.*?">.*?<\/span>)?([\s\S]*?)<\/li>/g,
  SECTION_ID: /<strong>section_id<\/strong>:\s*(\d+)/,
  SLIDE_ID: /<strong>slide_id<\/strong>:\s*(\d+)/,
  SECTION_TYPE: /<strong>section_type<\/strong>:\s*(\w+)/,
  SECTION_TITLE: /<strong>section_title<\/strong>:\s*(.*?)(?=<strong>|$)/s,
  PLACEMENT: /<strong>question_placement<\/strong>:\s*(\w+)/,
  QUESTION_TYPE: /<strong>question_type<\/strong>:\s*(\w+)/,
},
PROPERTIES: {
    IMPORTED_IDS: 'IMPORTED_SLIDE_IDS'
},
PLACEMENTS: ['live', 'example', 'ai', 'homework'],
FINAL_SLIDE_TITLES: {
  'live':   ' سؤال ',
  'ai':   ' سؤال ',
  'homework':   ' سؤال ',
  'example':   ' مثال '
}
};


// --- UI & MENU FUNCTIONS ---


function onOpen(e) {
SlidesApp.getUi()
  .createMenu(CONFIG.UI.MENU_TITLE)
  .addItem(CONFIG.UI.IMPORT_ITEM, 'showImportDialog')
  .addToUi();
}


function showImportDialog() {
const htmlOutput = HtmlService.createHtmlOutputFromFile('Dialog')
  .setWidth(CONFIG.UI.DIALOG_WIDTH)
  .setHeight(CONFIG.UI.DIALOG_HEIGHT);
SlidesApp.getUi().showModalDialog(htmlOutput, CONFIG.UI.DIALOG_TITLE);
}


// --- DATA PERSISTENCE ---


function saveUserData(htmlFileUrl, imageFolderId) {
try {
  const properties = PropertiesService.getUserProperties();
  properties.setProperty('HTML_FILE_URL', htmlFileUrl || '');
  properties.setProperty('IMAGE_FOLDER_ID', imageFolderId || '');
  return true;
} catch (error) {
  Logger.log(`Error saving user data: ${error.toString()}`);
  return false;
}
}


function getSavedUserData() {
const properties = PropertiesService.getUserProperties();
return {
  htmlFileUrl: properties.getProperty('HTML_FILE_URL') || '',
  imageFolderId: properties.getProperty('IMAGE_FOLDER_ID') || ''
};
}


// --- FRONTEND-CALLABLE FUNCTIONS ---


function getSlidesForPreview(fileUrl, folderId) {
try {
  if (!fileUrl || !folderId) throw new Error(  ' رابط   الملف   ومعرف   المجلد   مطلوبان .');
  saveUserData(fileUrl, folderId);


  const fileId = (fileUrl.match(CONFIG.REGEX.DRIVE_FILE_ID) || [])[0];
  if (!fileId) throw new Error(  ' رابط   ملف  HTML  غير   صالح .');
   const htmlContent = DriveApp.getFileById(fileId).getBlob().getDataAsString('UTF-8');
  if (!htmlContent.trim()) throw new Error(  ' ملف  HTML  فارغ .');
   const slideHtmlSections = htmlContent.match(CONFIG.REGEX.SLIDE_SECTION) || [];
  if (slideHtmlSections.length === 0) return [];
  const imageFolder = DriveApp.getFolderById(folderId);
  const imageFiles = imageFolder.getFiles();
  const imageMap = new Map();
  while(imageFiles.hasNext()){
      const file = imageFiles.next();
      imageMap.set(file.getName(), file.getBlob());
  }
  const slidesData = slideHtmlSections.map((slideHtml, index) => {
    const slideData = parseSlideHtml(slideHtml, index);
    if (slideData.imageName && imageMap.has(slideData.imageName)) {
        const blob = imageMap.get(slideData.imageName);
        if (blob.getBytes().length < 4 * 1024 * 1024) {
           slideData.imageUrl = `data:${blob.getContentType()};base64,${Utilities.base64Encode(blob.getBytes())}`;
        }
    }
    return slideData;
  });


  // Filter out already imported slides
  const properties = PropertiesService.getUserProperties();
  const importedIdsJson = properties.getProperty(CONFIG.PROPERTIES.IMPORTED_IDS) || '{}';
  const importedIds = JSON.parse(importedIdsJson);


  const newSlides = slidesData.filter(slide => {
      const id = slide.questionId || slide.slideId;
      return id ? !importedIds[id] : true; // Keep slides without an ID
  });


  return newSlides;


} catch (e) {
  Logger.log(`Error in getSlidesForPreview: ${e.toString()}`);
  return { error:   ` فشل   تحميل   المعاينة : ${e.message}` };
}
}




function importSelectedSlides(selectedSlides, folderId) {
if (!selectedSlides || selectedSlides.length === 0) {
  return { error:   ' لم   يتم   تحديد   أي   شرائح   للاستيراد .' };
}
try {
  const presentation = SlidesApp.getActivePresentation();
  const imageFolder = DriveApp.getFolderById(folderId);
   selectedSlides.forEach(slideData => {
    processSingleSlide(presentation, slideData, imageFolder);
  });
   // --- Store IDs of imported slides ---
  const properties = PropertiesService.getUserProperties();
  const importedIdsJson = properties.getProperty(CONFIG.PROPERTIES.IMPORTED_IDS) || '{}';
  const importedIds = JSON.parse(importedIdsJson);
   selectedSlides.forEach(slideData => {
      const id = slideData.questionId || slideData.slideId;
      if (id) {
          importedIds[id] = true;
      }
  });
   properties.setProperty(CONFIG.PROPERTIES.IMPORTED_IDS, JSON.stringify(importedIds));
   // Return a list of the imported IDs so the client can filter its view
  return selectedSlides.map(s => s.questionId || s.slideId).filter(Boolean);


} catch (e) {
  Logger.log(`Import failed: ${e.toString()}`);
  return { error:   `❌  حدث   خطأ   أثناء   الاستيراد : ${e.message}` };
}
}


// --- HELPER & PROCESSING FUNCTIONS ---


function parseSlideHtml(slideHtml, index) {
const cleanHtmlText = (text) => text.replace(/<p.*?>/g, '\n').replace(/<.*?>/g, ' ').replace(/\s+/g, ' ').trim();


const titleMatch = slideHtml.match(CONFIG.REGEX.TITLE_TEXT);
const originalTitle = titleMatch ? cleanHtmlText(titleMatch[1]) :   ` الشريحة  ${index + 1}`;
 const isQuestion = CONFIG.REGEX.QUESTION_TYPE.test(slideHtml);
const placement = (slideHtml.match(CONFIG.REGEX.PLACEMENT) || [])[1] || 'live';
 let title = originalTitle;
if (isQuestion) {
  title = `${placement}: ${originalTitle}`;
}


let questionBody = null;
let answerOptions = [];
if (isQuestion) {
  const bodyMatch = slideHtml.match(CONFIG.REGEX.QUESTION_BODY);
  if (bodyMatch && bodyMatch[1]) {
    questionBody = cleanHtmlText(bodyMatch[1]);
  }
  let optionMatch;
  const answerRegex = new RegExp(CONFIG.REGEX.ANSWER_OPTIONS.source, 'g');
  while ((optionMatch = answerRegex.exec(slideHtml)) !== null) {
    answerOptions.push(cleanHtmlText(optionMatch[1]));
  }
}


const sectionTitleMatch = slideHtml.match(CONFIG.REGEX.SECTION_TITLE);
let sectionTitle = sectionTitleMatch ? sectionTitleMatch[1].replace(/<.*?>/g, '').trim() : null;


return {
  html: slideHtml,
  title: title,
  originalTitle: originalTitle,
  imageName: (slideHtml.match(CONFIG.REGEX.IMAGE_SRC) || [])[1] || null,
  imageUrl: null,
  sectionId: (slideHtml.match(CONFIG.REGEX.SECTION_ID) || [])[1] || null,
  slideId: (slideHtml.match(CONFIG.REGEX.SLIDE_ID) || [])[1] || null,
  questionId: isQuestion ? originalTitle : null,
  sectionType: (slideHtml.match(CONFIG.REGEX.SECTION_TYPE) || [])[1] || null,
  sectionTitle: sectionTitle,
  placement: placement,
  isQuestion: isQuestion,
  showSectionId: false,
  questionType: (slideHtml.match(CONFIG.REGEX.QUESTION_TYPE) || [])[1] || null,
  questionBody: questionBody,
  answerOptions: answerOptions,
  isCheckpoint: false // This will be set by the client
};
}


function processSingleSlide(presentation, slideData, imageFolder) {
const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);


let finalTitle = slideData.isQuestion ? (CONFIG.FINAL_SLIDE_TITLES[slideData.placement] ||   ' سؤال ') : slideData.title;
addStyledTitle(slide, finalTitle);


if (slideData.imageName) {
  addStyledImage(slide, slideData.imageName, imageFolder);
} else if (slideData.isQuestion) {
  addQuestionContent(slide, slideData);
}


// --- Construct and add ID Box ---
const idTextLines = [];
if (slideData.isQuestion) {
  if (slideData.questionId) {
    idTextLines.push(`question_id: ${slideData.questionId}`);
  }
  idTextLines.push(`question_placement: ${slideData.placement}`);
   if (slideData.isCheckpoint) {
      idTextLines.push('checkpoint');
      idTextLines.push('required_correct: 3');
      idTextLines.push('attempt_window: 5');
  }
} else {
  if (slideData.showSectionId && slideData.sectionId) {
    idTextLines.push(`section_id: ${slideData.sectionId}`);
  }
  if (slideData.slideId) {
    idTextLines.push(`slide_id: ${slideData.slideId}`);
  }
}
 if (idTextLines.length > 0) {
  addIdBox(slide, idTextLines.join('\n'), slideData.isCheckpoint);
}
}


function addIdBox(slide, idText, isCheckpoint) {
if (!idText || !idText.trim()) return;


const { ID_BOX_FILL_COLOR, ID_BOX_BORDER_COLOR, ID_BOX_FONT_COLOR, ID_BOX_VALUE_FONT_COLOR } = CONFIG.LAYOUT;
const ID_BOX_WIDTH = 220;
// Increase height for checkpoint slides
const ID_BOX_HEIGHT = isCheckpoint ? 70 : 50;
const TOP_POSITION = 10, LEFT_MARGIN = 10;
 const idShape = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, LEFT_MARGIN, TOP_POSITION, ID_BOX_WIDTH, ID_BOX_HEIGHT);
idShape.getFill().setSolidFill(ID_BOX_FILL_COLOR);
const border = idShape.getBorder();
border.setWeight(1);
border.getLineFill().setSolidFill(ID_BOX_BORDER_COLOR);
 const textRange = idShape.getText();
textRange.setText(idText);


// Set base styles for the entire box
const overallStyle = textRange.getTextStyle();
overallStyle.setFontFamily('Noto Naskh Arabic');
overallStyle.setFontSize(10);
 try {
  textRange.getParagraphs().forEach(paragraph => {
      const paraText = paragraph.getRange().asString();
      const colonIndex = paraText.indexOf(':');
   
      if (colonIndex !== -1) {
          // Style the key (e.g., "question_id:")
          const keyRange = paragraph.getRange().getRange(0, colonIndex + 1);
          keyRange.getTextStyle().setBold(true).setForegroundColor(ID_BOX_FONT_COLOR);
        
          // Style the value (e.g., "12345")
          const valueRange = paragraph.getRange().getRange(colonIndex + 1, paraText.length);
          valueRange.getTextStyle().setBold(false).setForegroundColor(ID_BOX_VALUE_FONT_COLOR);


      } else {
          // Style lines without a colon (like "checkpoint") as bold and black
          paragraph.getRange().getTextStyle().setBold(true).setForegroundColor(ID_BOX_FONT_COLOR);
      }
  });
  // Set alignment for the whole box
  textRange.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.LEFT);
} catch (e) {
  Logger.log(`Error applying styles to ID box: ${e.message}`);
}
}




function addStyledTitle(slide, title) {
if (!title || !title.trim()) return;
const pageWidth = SlidesApp.getActivePresentation().getPageWidth();
const ID_BOX_WIDTH = 220; // from addIdBox
const TITLE_HEIGHT = 50;
// Adjust height for checkpoint to match the larger ID box
const idBoxHeight = slide.getPageElements().find(p => p.getObjectId().includes("Rectangle") && p.getLeft() === 10)?.getHeight() || TITLE_HEIGHT;
const TOP_POSITION = 10;
 const titleWidth = pageWidth - ID_BOX_WIDTH - 30; // 10px margin on each side + 10px gap
const titleLeft = ID_BOX_WIDTH + 20;
 const titleShape = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, titleLeft, TOP_POSITION, titleWidth, idBoxHeight);
titleShape.getFill().setSolidFill(CONFIG.UI.TITLE_FILL_COLOR);
titleShape.getBorder().setTransparent();
 const textRange = titleShape.getText();
textRange.setText(title);
 try {
 textRange.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
 titleShape.getText().getRuns().forEach(run => {
    run.getTextStyle().setFontFamily('Arial').setFontSize(24).setBold(true).setForegroundColor(CONFIG.UI.TITLE_FONT_COLOR);
 });
} catch (e) {
    Logger.log(`Error styling title: ${title}. Error: ${e.toString()}`);
}
}


function addQuestionContent(slide, slideData) {
if (!slideData.isQuestion || !slideData.questionBody) return;
const presentation = SlidesApp.getActivePresentation();
const pageWidth = presentation.getPageWidth();
const pageHeight = presentation.getPageHeight();
 const MARGIN = 40;
const CONTENT_TOP = 90; // Move content down slightly to not overlap with taller header


const fullText = [
  slideData.questionBody,
  ...slideData.answerOptions.map((opt, i) => `${String.fromCharCode(65 + i)}.    ${opt}`)
].join('\n\n');


if (!fullText.trim()) return;


const contentWidth = pageWidth - (MARGIN * 2);
const contentHeight = pageHeight - CONTENT_TOP - MARGIN;
const contentShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, MARGIN, CONTENT_TOP, contentWidth, contentHeight);
const textRange = contentShape.getText();
textRange.setText(fullText);


try {
    textRange.getParagraphs().forEach(paragraph => {
        paragraph.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.RIGHT);
        paragraph.getRange().getTextStyle().setFontFamily('Arial').setFontSize(18);
    });
} catch(e) {
     Logger.log(`Error styling question content for questionId ${slideData.questionId}. Error: ${e.toString()}`);
}
}


/**
* Inserts an image onto a slide, resizing it to fit the available space below the header
* while maintaining its aspect ratio, and then centers it.
* @param {GoogleAppsScript.Slides.Slide} slide The slide to add the image to.
* @param {string} imageName The name of the image file.
* @param {GoogleAppsScript.Drive.Folder} imageFolder The Drive folder containing the image.
*/
function addStyledImage(slide, imageName, imageFolder) {
try {
  const files = imageFolder.getFilesByName(imageName);
  if (!files.hasNext()) {
      Logger.log(`Image not found: ${imageName}`);
      return;
  }
   const imageBlob = files.next().getBlob();
  const image = slide.insertImage(imageBlob);
   // --- Configuration for layout ---
  const MARGIN = 20;
  const HEADER_HEIGHT = 90; // Space reserved for the title and ID box
 
  const presentation = SlidesApp.getActivePresentation();
  const pageWidth = presentation.getPageWidth();
  const pageHeight = presentation.getPageHeight();


  // --- Calculate available space for the image ---
  const availableWidth = pageWidth - (MARGIN * 2);
  const availableHeight = pageHeight - HEADER_HEIGHT - MARGIN;
   // --- Get original image dimensions ---
  const originalWidth = image.getWidth();
  const originalHeight = image.getHeight();
  const aspectRatio = originalWidth / originalHeight;


  // --- Calculate new dimensions to fit available space, maintaining aspect ratio ---
  let newWidth = originalWidth;
  let newHeight = originalHeight;


  // Check if scaling based on width is necessary
  if (newWidth > availableWidth) {
      newWidth = availableWidth;
      newHeight = newWidth / aspectRatio;
  }


  // Check if scaling based on height is necessary (after potential width scaling)
  if (newHeight > availableHeight) {
      newHeight = availableHeight;
      newWidth = newHeight * aspectRatio;
  }
 
  // --- Apply the new dimensions ---
  image.setWidth(newWidth);
  image.setHeight(newHeight);


  // --- Center the resized image in the available space below the header ---
  const left = (pageWidth - newWidth) / 2;
  const top = HEADER_HEIGHT + (availableHeight - newHeight) / 2;


  image.setLeft(left);
  image.setTop(top);


} catch (e) {
    Logger.log(`Error adding image ${imageName}: ${e.message}`);
}
}

