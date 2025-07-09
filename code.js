/**
* @OnlyCurrentDoc
*
* Final Version 2.8.9:
* - UI initialization logic in Dialog.html has been fixed to prevent race conditions.
* - Removed the unused `importFromSheet` function to clean up the code.
* - The main import functionality remains unchanged.
*/

// =====================
//  Global Configuration
// =====================
const CONFIG = {
  UI: {
    MENU_TITLE: '📥 استيراد HTML (v2.8.9)',
    IMPORT_ITEM: 'فتح واجهة الاستيراد',
    DIALOG_TITLE: 'مستورد الشرائح التفاعلي',
    DIALOG_WIDTH: 1200,
    DIALOG_HEIGHT: 800,
    TITLE_FILL_COLOR: '#0B5FA5',
    TITLE_FONT_COLOR: '#FFFFFF',
  },
  LAYOUT: {
    ID_BOX_FILL_COLOR: '#f3f4f6',
    ID_BOX_BORDER_COLOR: '#d1d5db',
    ID_BOX_FONT_COLOR: '#000000',
    ID_BOX_VALUE_FONT_COLOR: '#FF0000',
    ID_BOX_WIDTH: 220,
    QUESTION_CONTENT_TOP: 80,
  },
  REGEX: {
    DRIVE_FILE_ID: /[-\w]{25,}/,
    BANK_SLIDE_SECTION: /<div[^>]*class="instance dir-rtl\s*"\s*data-questionid="[^"]*">[\s\S]*?<\/div>(?=\s*<div[^>]*class="instance dir-rtl\s*"|$)/g,
    SESSION_SLIDE_SECTION: /<section class="col-12">[\s\S]*?<\/section>/g,
    TITLE_TEXT: /<div class="question-number[^>]*"><p>([\s\S]*?)<\/p><\/div>/,
    IMAGE_SRC: /<img.*?src=["'](?:static\/)?(.*?\.[\w]+)["']/,
    QUESTION_BODY: /<div class="stem"[^>]*>([\s\S]*?)<\/div>/,
    ANSWER_OPTIONS: /<li[^>]*>([\s\S]*?)<\/li>/g,
    BANK_QUESTION_ID_ATTR: /data-questionid="(\d+)"/,
    BANK_IS_QUESTION_ATTR: /data-parttype="(mcq|frq|frq_ai)"/,
    SESSION_METADATA_BLOCK: /<div class="container second-container">([\s\S]*?)<\/div>/,
    SESSION_METADATA_ITEM: /<strong>(.*?)<\/strong>:\s*(.*?)(?=<p><strong>|$)/g,
    SESSION_QUESTION_ID: /<div class="question-number.*?"><p>(\d+)<\/p><\/div>/,
  },
  PROPERTIES: {
    IMPORTED_IDS: 'IMPORTED_SLIDE_IDS'
  },
  PLACEMENTS: ['live', 'example', 'ai', 'homework', 'interactive example'],
  FINAL_SLIDE_TITLES: {
    'live': 'سؤال',
    'ai': 'سؤال',
    'homework': 'سؤال',
    'example': 'مثال',
    'interactive example': 'سؤال'
  }
};

// =====================
//  UI & Menu Functions
// =====================
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

// =====================
//  Data Persistence Functions
// =====================
function saveUserData(htmlFileUrls, imageFolderId) {
  try {
    const properties = PropertiesService.getUserProperties();
    properties.setProperty('HTML_FILE_URLS', JSON.stringify(htmlFileUrls || []));
    properties.setProperty('IMAGE_FOLDER_ID', imageFolderId || '');
    return true;
  } catch (error) {
    Logger.log(`Error saving user data: ${error.toString()}`);
    return false;
  }
}

function getSavedUserData() {
  const properties = PropertiesService.getUserProperties();
  const urlsJson = properties.getProperty('HTML_FILE_URLS');
  return {
    htmlFileUrls: urlsJson ? JSON.parse(urlsJson) : [],
    imageFolderId: properties.getProperty('IMAGE_FOLDER_ID') || ''
  };
}

// =====================
//  Core Importer Functions
// =====================
function getSlidesForPreview(fileUrls, folderId) {
  try {
    if (!fileUrls || fileUrls.length === 0 || !folderId) {
      throw new Error('رابط ملف HTML واحد على الأقل ومعرف المجلد مطلوبان.');
    }
    saveUserData(fileUrls, folderId);

    let allSlides = [];
    let processedQuestionIds = new Set();
    const importedIds = getImportedSlidesIds();

    // اجمع كل question_id من جميع ملفات البنك
    let allBankQuestionIds = new Set();
    for (let i = 1; i < fileUrls.length; i++) { // ابدأ من 1 لأن الملف 0 هو الحصة
      const fileUrl = fileUrls[i];
      if (!fileUrl) continue;
      const fileId = (fileUrl.match(CONFIG.REGEX.DRIVE_FILE_ID) || [])[0];
      if (fileId) {
        try {
          const htmlContent = DriveApp.getFileById(fileId).getBlob().getDataAsString('UTF-8');
          const blocks = htmlContent.match(CONFIG.REGEX.BANK_SLIDE_SECTION) || [];
          blocks.forEach((block) => {
            const match = block.match(CONFIG.REGEX.BANK_QUESTION_ID_ATTR);
            if (match) {
              allBankQuestionIds.add(match[1]);
            }
          });
        } catch (e) {
          Logger.log(`Error processing bank file ${fileUrl}: ${e.message}`);
        }
      }
    }

    // --- اجمع كل أسئلة الحصة التي ليس لها مثيل في البنك ---
    let sessionQuestionsUnlinked = [];
    if (fileUrls[0]) {
      const fileId = (fileUrls[0].match(CONFIG.REGEX.DRIVE_FILE_ID) || [])[0];
      if (fileId) {
        try {
          const htmlContent = DriveApp.getFileById(fileId).getBlob().getDataAsString('UTF-8');
          const blocks = htmlContent.match(CONFIG.REGEX.SESSION_SLIDE_SECTION) || [];
          blocks.forEach((block, index) => {
            const slideData = parseSessionFormat(block, index);
            if (slideData && slideData.isQuestion && slideData.questionId && !allBankQuestionIds.has(slideData.questionId)) {
              sessionQuestionsUnlinked.push(slideData.questionId);
            }
          });
        } catch (e) {
          Logger.log(`Error processing session file for unlinked check: ${e.message}`);
        }
      }
    }

    // عالج جميع الملفات
    for (let i = 0; i < fileUrls.length; i++) {
      const fileUrl = fileUrls[i];
      const isSessionFormat = (i === 0);
      if (!fileUrl) continue;

      const fileId = (fileUrl.match(CONFIG.REGEX.DRIVE_FILE_ID) || [])[0];
      if (fileId) {
        try {
          const htmlContent = DriveApp.getFileById(fileId).getBlob().getDataAsString('UTF-8');
          const blocks = htmlContent.match(isSessionFormat ? CONFIG.REGEX.SESSION_SLIDE_SECTION : CONFIG.REGEX.BANK_SLIDE_SECTION) || [];

          blocks.forEach((block, index) => {
            const slideData = isSessionFormat ? parseSessionFormat(block, index) : parseBankFormat(block, index);
            if (slideData) {
              // تحديد حالة Unlinked
              slideData.isUnlinked = isSessionFormat && slideData.isQuestion && slideData.questionId && sessionQuestionsUnlinked.includes(slideData.questionId);
              
              const slideId = slideData.questionId || slideData.slideId;
              if ((!slideId || !importedIds[slideId]) && !processedQuestionIds.has(slideData.questionId)) {
                allSlides.push(slideData);
                if (slideData.questionId) {
                  processedQuestionIds.add(slideData.questionId);
                }
              }
            }
          });
        } catch (e) {
          Logger.log(`Error processing file ${fileUrl}: ${e.message}`);
        }
      }
    }

    if (allSlides.length === 0) {
      Logger.log("No new slides found after processing all files.");
      return [];
    }

    // جلب الصور
    const imageFolder = DriveApp.getFolderById(folderId);
    const imageMap = new Map();
    const imageFiles = imageFolder.getFiles();
    while (imageFiles.hasNext()) {
      const file = imageFiles.next();
      imageMap.set(file.getName(), file.getBlob());
    }

    allSlides.forEach(slideData => {
      if (slideData.imageName && imageMap.has(slideData.imageName)) {
        const blob = imageMap.get(slideData.imageName);
        // تحويل الصور الصغيرة فقط إلى base64 لتجنب الأخطاء
        if (blob.getBytes().length < 4 * 1024 * 1024) { 
          slideData.imageUrl = `data:${blob.getContentType()};base64,${Utilities.base64Encode(blob.getBytes())}`;
        }
      }
    });

    return allSlides;

  } catch (e) {
    Logger.log(`Error in getSlidesForPreview: ${e.stack}`);
    return { error: `فشل تحميل المعاينة: ${e.message}` };
  }
}

function importSelectedSlides(selectedSlides, folderId) {
  if (!selectedSlides || selectedSlides.length === 0) {
    return { error: 'لم يتم تحديد أي شرائح للاستيراد.' };
  }
  try {
    // تحديد أول سؤال عليه checkpoint
    let checkpointIndex = selectedSlides.findIndex(slide => slide.isCheckpoint);
    if (checkpointIndex !== -1) {
      // أول سؤال checkpoint والأربعة بعده (أو أقل) = live
      // البقية = ai
      for (let i = 0; i < selectedSlides.length; i++) {
        if (i >= checkpointIndex && i < checkpointIndex + 5) {
          selectedSlides[i].placement = 'live';
        } else if (i > checkpointIndex + 4) {
          selectedSlides[i].placement = 'ai';
        }
      }
    }

    const presentation = SlidesApp.getActivePresentation();
    const imageFolder = folderId ? DriveApp.getFolderById(folderId) : null;
    selectedSlides.forEach(slideData => {
      processSingleSlide(presentation, slideData, imageFolder);
    });

    // حفظ الـ IDs المستوردة
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

    return selectedSlides.map(s => s.questionId || s.slideId).filter(Boolean);
  } catch (e) {
    Logger.log(`Import failed: ${e.stack}`);
    return { error: `❌ حدث خطأ أثناء الاستيراد: ${e.message}` };
  }
}

// =====================
//  Parsing Functions
// =====================
function cleanHtmlText(text) {
  if (!text) return '';
  return text.replace(/<p[^>]*>/g, '\n').replace(/<\/p>/g, '\n').replace(/<br\s*\/?>/g, '\n').replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '').replace(/<div[^>]*>/g, '').replace(/<\/div>/g, '').replace(/<.*?>/g, ' ').replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').replace(/^[A-Z]\s*[\.\-\)]\s*/, '').trim();
}

function extractMCQOptions(slideHtml) {
  const answerOptions = [];
  let correctAnswerIndex = null;
  const cleanOptionText = (text) => text ? text.replace(/<.*?>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  
  const answersHtmlMatch = slideHtml.match(/<ul[^>]*class="[^"]*mcq_choices[^"]*"[^>]*>([\s\S]*?)<\/ul>/i);
  if (!answersHtmlMatch) {
    return { answerOptions: [], correctAnswerIndex: null };
  }
  
  const choicesHtml = answersHtmlMatch[1];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/g;
  let liMatch;
  let index = 0;
  while ((liMatch = liRegex.exec(choicesHtml)) !== null) {
    const innerLi = liMatch[1].trim();
    const isCorrect = /class="[^"]*correct[^"]*"/i.test(liMatch[0]);
    
    if (isCorrect) {
      correctAnswerIndex = index;
    }
    
    const textAfterSpan = innerLi.replace(/<span[^>]*>[A-Z]<\/span>/i, '').trim();
    const cleanOption = cleanOptionText(textAfterSpan);
    if (cleanOption) {
      answerOptions.push(cleanOption);
    }
    index++;
  }
  return { answerOptions, correctAnswerIndex };
}

function parseSessionFormat(slideHtml, index) {
  const metadata = {};
  const metadataBlockMatch = slideHtml.match(CONFIG.REGEX.SESSION_METADATA_BLOCK);
  if (metadataBlockMatch) {
    let match;
    const regex = new RegExp(CONFIG.REGEX.SESSION_METADATA_ITEM.source, 'g');
    while ((match = regex.exec(metadataBlockMatch[1])) !== null) {
      const key = match[1].trim();
      const value = match[2].replace(/<\/?[^>]+(>|$)/g, "").trim();
      metadata[key] = value;
    }
  }

  const questionIdMatch = slideHtml.match(CONFIG.REGEX.SESSION_QUESTION_ID);
  const questionId = questionIdMatch ? questionIdMatch[1] : (metadata.slide_id || null);
  const titleMatch = slideHtml.match(CONFIG.REGEX.TITLE_TEXT);
  const title = titleMatch ? cleanHtmlText(titleMatch[1]) : `شريحة ${index + 1}`;
  const isQuestion = 'question_type' in metadata;
  const questionBodyMatch = slideHtml.match(CONFIG.REGEX.QUESTION_BODY);
  const questionBody = questionBodyMatch ? cleanHtmlText(questionBodyMatch[1]) : null;
  
  let answerOptions = [];
  let correctAnswerIndex = null;
  if (isQuestion && metadata.question_type === 'mcq') {
    const result = extractMCQOptions(slideHtml);
    answerOptions = result.answerOptions;
    correctAnswerIndex = result.correctAnswerIndex;
  }

  return {
    html: slideHtml,
    title: title,
    originalTitle: title,
    imageName: (slideHtml.match(CONFIG.REGEX.IMAGE_SRC) || [])[1] || null,
    imageUrl: null,
    sectionId: metadata.section_id || null,
    slideId: metadata.slide_id || null,
    questionId: questionId,
    sectionType: metadata.section_type || null,
    sectionTitle: metadata.section_title || null,
    placement: metadata.question_placement || 'live',
    isQuestion: isQuestion,
    showSectionId: false,
    questionType: metadata.question_type || metadata.slide_type || null,
    questionBody: questionBody,
    answerOptions: answerOptions,
    correctAnswerIndex: correctAnswerIndex,
    isCheckpoint: metadata.checkpoint === 'TRUE'
  };
}

function parseBankFormat(slideHtml, index) {
  const questionIdMatch = slideHtml.match(CONFIG.REGEX.BANK_QUESTION_ID_ATTR);
  if (!questionIdMatch) return null;
  
  const questionId = questionIdMatch[1];
  const questionTypeMatch = slideHtml.match(CONFIG.REGEX.BANK_IS_QUESTION_ATTR);
  if (!questionTypeMatch) return null;
  
  const questionType = questionTypeMatch[1];
  const titleMatch = slideHtml.match(CONFIG.REGEX.TITLE_TEXT);
  const originalTitle = titleMatch ? cleanHtmlText(titleMatch[1]) : `سؤال ${index + 1}`;
  const bodyMatch = slideHtml.match(CONFIG.REGEX.QUESTION_BODY);
  const questionBody = bodyMatch ? cleanHtmlText(bodyMatch[1]) : null;
  
  let answerOptions = [];
  let correctAnswerIndex = null;
  if (questionType === 'mcq') {
    const result = extractMCQOptions(slideHtml);
    answerOptions = result.answerOptions;
    correctAnswerIndex = result.correctAnswerIndex;
  }

  let placement = 'ai'; // Default for bank questions
  if (questionType === 'frq' || questionType === 'frq_ai') {
    placement = 'homework';
  }

  return {
    html: slideHtml,
    title: originalTitle,
    originalTitle: originalTitle,
    imageName: (slideHtml.match(CONFIG.REGEX.IMAGE_SRC) || [])[1] || null,
    imageUrl: null,
    sectionId: null,
    slideId: null,
    questionId: questionId,
    sectionType: null,
    sectionTitle: null,
    placement: placement,
    isQuestion: true,
    showSectionId: false,
    questionType: questionType,
    questionBody: questionBody,
    answerOptions: answerOptions,
    correctAnswerIndex: correctAnswerIndex,
    isCheckpoint: false
  };
}

// =====================
//  Slide Creation Functions
// =====================
function processSingleSlide(presentation, slideData, imageFolder) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  let finalTitle = slideData.isQuestion ? (CONFIG.FINAL_SLIDE_TITLES[slideData.placement] || 'سؤال') : slideData.title;
  addStyledTitle(slide, finalTitle, slideData.isCheckpoint);

  if (slideData.imageName && imageFolder) {
    addStyledImage(slide, slideData.imageName, imageFolder);
  } else if (slideData.imageUrl) {
    addStyledImageFromUrl(slide, slideData.imageUrl);
  } else if (slideData.isQuestion) {
    addQuestionContent(slide, slideData);
  }

  const idTextLines = [];
  if (slideData.isQuestion) {
    if (slideData.questionId) idTextLines.push(`question_id: ${slideData.questionId}`);
    if (slideData.placement !== 'example' && slideData.placement !== 'interactive example') {
      idTextLines.push(`question_placement: ${slideData.placement || 'live'}`);
    }
    idTextLines.push(`homework: ${slideData.homework ? 'homework' : 'not_homework'}`);
    idTextLines.push(`slide_id: ${slideData.slideId ? slideData.slideId : 'new'}`);
    if (slideData.isCheckpoint) {
      idTextLines.push('checkpoint');
      idTextLines.push('required_correct: 3');
      idTextLines.push('attempt_window: 5');
    }
  } else {
    if (slideData.showSectionId && slideData.sectionId) idTextLines.push(`section_id: ${slideData.sectionId}`);
    if (slideData.slideId) idTextLines.push(`slide_id: ${slideData.slideId}`);
  }

  if (idTextLines.length > 0) {
    addIdBox(slide, idTextLines.join('\n'), slideData.isCheckpoint);
  }
}

function addStyledTitle(slide, title, isCheckpoint) {
  if (!title || !title.trim()) return;
  const pageWidth = SlidesApp.getActivePresentation().getPageWidth();
  const ID_BOX_WIDTH = CONFIG.LAYOUT.ID_BOX_WIDTH;
  const idBoxHeight = isCheckpoint ? 70 : 50;
  const TOP_POSITION = 10;
  const titleWidth = pageWidth - ID_BOX_WIDTH - 30;
  const titleLeft = ID_BOX_WIDTH + 20;

  const titleShape = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, titleLeft, TOP_POSITION, titleWidth, idBoxHeight);
  titleShape.getFill().setSolidFill(CONFIG.UI.TITLE_FILL_COLOR);
  titleShape.getBorder().setTransparent();
  
  const textRange = titleShape.getText();
  textRange.setText(title);
  try {
    textRange.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    textRange.getRuns().forEach(run => {
      run.getTextStyle().setFontFamily('Arial').setFontSize(24).setBold(true).setForegroundColor(CONFIG.UI.TITLE_FONT_COLOR);
    });
  } catch (e) {
    Logger.log(`Error styling title: ${title}. Error: ${e.toString()}`);
  }
}

function addStyledImage(slide, imageName, imageFolder) {
  try {
    const files = imageFolder.getFilesByName(imageName);
    if (files.hasNext()) {
      const imageBlob = files.next().getBlob();
      addStyledImageFromBlob(slide, imageBlob);
    } else {
      Logger.log(`Image not found in Drive: ${imageName}`);
    }
  } catch (e) {
    Logger.log(`Error adding image from Drive ${imageName}: ${e.message}`);
  }
}

function addStyledImageFromUrl(slide, imageUrl) {
  try {
    const imageBlob = UrlFetchApp.fetch(imageUrl).getBlob();
    addStyledImageFromBlob(slide, imageBlob);
  } catch (e) {
    Logger.log(`Error fetching image from URL ${imageUrl}: ${e.message}`);
  }
}

function addStyledImageFromBlob(slide, imageBlob) {
  try {
    const image = slide.insertImage(imageBlob);
    const MARGIN = 20;
    const HEADER_HEIGHT = 90;
    const presentation = SlidesApp.getActivePresentation();
    const pageWidth = presentation.getPageWidth();
    const pageHeight = presentation.getPageHeight();
    const availableWidth = pageWidth - (MARGIN * 2);
    const availableHeight = pageHeight - HEADER_HEIGHT - MARGIN;

    const originalWidth = image.getWidth();
    const originalHeight = image.getHeight();
    const aspectRatio = originalWidth / originalHeight;

    let newWidth = availableWidth;
    let newHeight = newWidth / aspectRatio;

    if (newHeight > availableHeight) {
      newHeight = availableHeight;
      newWidth = newHeight * aspectRatio;
    }

    image.setWidth(newWidth);
    image.setHeight(newHeight);
    const left = (pageWidth - newWidth) / 2;
    const top = HEADER_HEIGHT + (availableHeight - newHeight) / 2;
    image.setLeft(left).setTop(top);
  } catch (e) {
    Logger.log(`Error adding image blob: ${e.message}`);
  }
}

function addIdBox(slide, idText, isCheckpoint) {
  if (!idText || !idText.trim()) return;
  const { ID_BOX_FILL_COLOR, ID_BOX_BORDER_COLOR, ID_BOX_FONT_COLOR, ID_BOX_VALUE_FONT_COLOR, ID_BOX_WIDTH } = CONFIG.LAYOUT;
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
        // Style the key (before colon)
        const keyRange = paragraph.getRange().getRange(0, colonIndex + 1);
        keyRange.getTextStyle().setBold(true).setForegroundColor(ID_BOX_FONT_COLOR);
        // Style the value (after colon)
        const valueRange = paragraph.getRange().getRange(colonIndex + 1, paraText.length);
        valueRange.getTextStyle().setBold(false).setForegroundColor(ID_BOX_VALUE_FONT_COLOR);
      } else {
        // Style lines without a colon (like "checkpoint") as bold and black
        paragraph.getRange().getTextStyle().setBold(true).setForegroundColor(ID_BOX_FONT_COLOR);
      }
    });
    // Set alignment for the whole box
    textRange.getParagraphs().forEach(paragraph => {
      paragraph.setParagraphAlignment(SlidesApp.ParagraphAlignment.LEFT);
    });
  } catch (e) {
    Logger.log(`Error applying styles to ID box: ${e.message}`);
  }
}

function addQuestionContent(slide, slideData) {
  if (!slideData.isQuestion || !slideData.questionBody) return;
  const presentation = SlidesApp.getActivePresentation();
  const pageWidth = presentation.getPageWidth();
  const pageHeight = presentation.getPageHeight();
  const MARGIN = 60;
  const CONTENT_TOP = 110;
  const BOX_BG = '#f8f9fa';
  const BOX_BORDER = '#e9ecef';

  const contentWidth = pageWidth - (MARGIN * 2);
  const contentHeight = pageHeight - CONTENT_TOP - MARGIN;

  const contentShape = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, MARGIN, CONTENT_TOP, contentWidth, contentHeight);
  contentShape.getFill().setSolidFill(BOX_BG);
  contentShape.getBorder().setWeight(2).getLineFill().setSolidFill(BOX_BORDER);

  const textRange = contentShape.getText();
  let fullText = slideData.questionBody;
  if (slideData.answerOptions && slideData.answerOptions.length > 0) {
    fullText += '\n\nالإجابات:\n\n';
    slideData.answerOptions.forEach((opt, i) => {
      const isCorrect = slideData.correctAnswerIndex === i;
      const marker = isCorrect ? '✓ ' : '';
      fullText += `${marker}${String.fromCharCode(65 + i)}. ${opt}\n`;
    });
  }
  textRange.setText(fullText);

  try {
    const paragraphs = textRange.getParagraphs();
    paragraphs.forEach(p => {
      const style = p.getParagraphStyle();
      if (style) {
        style.setParagraphAlignment(SlidesApp.ParagraphAlignment.RIGHT);
      }
    });
    if (paragraphs.length > 0) {
      paragraphs[0].getRange().getTextStyle().setFontFamily('Arial').setFontSize(20).setBold(true).setForegroundColor('#374151');
    }
    for (let i = 1; i < paragraphs.length; i++) {
      const paraText = paragraphs[i].getRange().asString().trim();
      const paraRange = paragraphs[i].getRange();
      if (paraText === 'الإجابات:') {
        paraRange.getTextStyle().setFontFamily('Arial').setFontSize(16).setBold(true).setForegroundColor('#0B5FA5');
      } else if (paraText.match(/^[A-Z]\./) || paraText.match(/^✓ [A-Z]\./)) {
        const isCorrect = paraText.startsWith('✓');
        paraRange.getTextStyle().setFontFamily('Arial').setFontSize(18).setBold(isCorrect).setForegroundColor(isCorrect ? '#16a34a' : '#374151');
        if (isCorrect) {
          paraRange.getTextStyle().setBackgroundColor('#d1fae5');
        }
      }
    }
  } catch (e) {
    Logger.log(`Error during advanced styling for questionId ${slideData.questionId}. Error: ${e.toString()}.`);
  }
  contentShape.setLeft((pageWidth - contentWidth) / 2);
  contentShape.setTop(CONTENT_TOP);
}

// =====================
//  Sheet & Utility Functions
// =====================
function getSheetRows(sheetUrl) {
  try {
    const fileIdMatch = sheetUrl.match(/[-\w]{25,}/);
    if (!fileIdMatch) throw new Error('رابط الشيت غير صالح');
    const fileId = fileIdMatch[0];
    const ss = SpreadsheetApp.openById(fileId);
    const sheet = ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];

    const headers = data[0].map(h => (h || '').toString().trim());
    const requiredHeaders = ['question_id', 'section_no', 'question_type', 'question_placement'];
    const headerIndices = {};
    for (const h of requiredHeaders) {
      const index = headers.indexOf(h);
      if (index === -1) {
        throw new Error(`يجب أن يحتوي الشيت على الأعمدة المطلوبة. العمود المفقود: ${h}`);
      }
      headerIndices[h] = index;
    }

    return data.slice(1).map(row => {
      if (!row[headerIndices.question_id]) return null;
      return {
        question_id: row[headerIndices.question_id].toString().trim(),
        section_no: row[headerIndices.section_no] ? row[headerIndices.section_no].toString().trim() : '',
        question_type: row[headerIndices.question_type] ? row[headerIndices.question_type].toString().trim() : '',
        question_placement: row[headerIndices.question_placement] ? row[headerIndices.question_placement].toString().trim() : ''
      };
    }).filter(Boolean);
  } catch (e) {
    Logger.log(`getSheetRows Error: ${e.stack}`);
    return { error: e.message };
  }
}

function getImportedSlidesIds() {
  const properties = PropertiesService.getUserProperties();
  const importedIdsJson = properties.getProperty(CONFIG.PROPERTIES.IMPORTED_IDS) || '{}';
  return JSON.parse(importedIdsJson);
}

function resetImportedSlidesServer() {
  try {
    const properties = PropertiesService.getUserProperties();
    properties.deleteProperty(CONFIG.PROPERTIES.IMPORTED_IDS);
    return true;
  } catch (e) {
    Logger.log(`Error resetting properties: ${e.stack}`);
    throw new Error("Failed to reset properties on server.");
  }
}
