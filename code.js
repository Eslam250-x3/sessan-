/**
* @OnlyCurrentDoc
*
* Final Version 2.8.8:
* - Removed the "Import from Sheet" and "Test Question Bank Parsing" menu items
* and their associated functions to simplify the UI, as requested.
* - The main import functionality remains unchanged.
*/
































// =====================
//  Global Configuration
// =====================
const CONFIG = {
   UI: {
       MENU_TITLE: '📥   استيراد  HTML (v2.8.8)',
       IMPORT_ITEM: '  فتح   واجهة   الاستيراد  ',
       DIALOG_TITLE: '  مستورد   الشرائح   التفاعلي  ',
       DIALOG_WIDTH: 1200,
       DIALOG_HEIGHT: 800,
       TITLE_FILL_COLOR: '#0072b4',
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
   PLACEMENTS: ['live', 'example', 'ai', 'homework', 'interactive example', 'not_homework'],
   FINAL_SLIDE_TITLES: {
       'live': '  سؤال  ',
       'ai': '  سؤال  ',
       'homework': '  سؤال  ',
       'example': '  مثال  ',
       'interactive example': '  سؤال  '
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
           throw new Error('  رابط   ملف  HTML  واحد   على   الأقل   ومعرف   المجلد   مطلوبان .');
       }
       saveUserData(fileUrls, folderId);
 
 
 
 
 
 
 
 
       let allSlides = [];
       let processedQuestionIds = new Set();
       const importedIds = getImportedSlidesIds();
 
 
 
 
 
 
 
 
       // اجمع كل question_id من جميع ملفات البنك
       let allBankQuestionIds = new Set();
       let bankQuestionIdsArr = [];
       for (let i = 0; i < fileUrls.length; i++) {
           if (i === 0) continue; // أول ملف هو الحصة
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
                           bankQuestionIdsArr.push(match[1]);
                       }
                   });
               } catch (e) {
                   Logger.log(`Error processing bank file ${fileUrl}: ${e.message}`);
               }
           }
       }
 
 
 
 
 
 
 
 
       // --- اجمع كل أسئلة الحصة (قبل الحذف) ---
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
                   Logger.log(`Error processing session file for unlinked: ${e.message}`);
               }
           }
       }
 
 
 
 
 
 
 
 
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
                           // منطق unlinked الصحيح: فقط الأسئلة في الحصة وغير موجودة في أي بنك (قبل الحذف)
                           if (isSessionFormat && slideData.isQuestion && slideData.questionId && sessionQuestionsUnlinked.includes(slideData.questionId)) {
                               slideData.isUnlinked = true;
                           } else {
                               slideData.isUnlinked = false;
                           }
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
 
 
 
 
 
 
 
 
       // بعد جمع كل الشرائح
       // استبعد المحذوف نهائياً
       const properties = PropertiesService.getUserProperties();
       let deleted = properties.getProperty('DELETED_QUESTIONS');
       let deletedArr = deleted ? JSON.parse(deleted) : [];
       allSlides = allSlides.filter(slide => {
         const id = slide.questionId || slide.slideId;
         return !deletedArr.includes(id);
       });
 
 
 
 
 
 
 
 
       if (allSlides.length === 0) {
           Logger.log("No new slides found after processing all files.");
           return [];
       }
 
 
 
 
 
 
 
 
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
               if (blob.getBytes().length < 4 * 1024 * 1024) {
                   slideData.imageUrl = `data:${blob.getContentType()};base64,${Utilities.base64Encode(blob.getBytes())}`;
               }
           }
       });
 
 
 
 
 
 
 
 
       return allSlides;
 
 
 
 
 
 
 
 
   } catch (e) {
       Logger.log(`Error in getSlidesForPreview: ${e.stack}`);
       return { error: `  فشل   تحميل   المعاينة : ${e.message}` };
   }
  }
  function importSelectedSlides(selectedSlides, folderId) {
   if (!selectedSlides || selectedSlides.length === 0) {
       return { error: '  لم   يتم   تحديد   أي   شرائح   للاستيراد . ' };
   }
   try {
       // تحديد أول سؤال عليه checkpoint
       let checkpointIndex = selectedSlides.findIndex(slide => slide.isCheckpoint);
       if (checkpointIndex !== -1) {
           // أول سؤال checkpoint والأربعة بعده (أو أقل إذا لم يوجد 4 بعده) = live
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
       return { error: `❌   حدث   خطأ   أثناء   الاستيراد  : ${e.message}` };
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
   let title = titleMatch ? cleanHtmlText(titleMatch[1]) : `  شريحة  ${index + 1}`;
   // استبدال عنوان Table of Contents
   if (title === 'Table of Contents') {
     title = 'محتوى الحصة';
   }
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
   const originalTitle = titleMatch ? cleanHtmlText(titleMatch[1]) : `  سؤال  ${index + 1}`;
   const bodyMatch = slideHtml.match(CONFIG.REGEX.QUESTION_BODY);
   const questionBody = bodyMatch ? cleanHtmlText(bodyMatch[1]) : null;
   let answerOptions = [];
   let correctAnswerIndex = null;
   if (questionType === 'mcq') {
       const result = extractMCQOptions(slideHtml);
       answerOptions = result.answerOptions;
       correctAnswerIndex = result.correctAnswerIndex;
   }
   // تحديد نوع placement بناءً على نوع السؤال
   let placement = 'ai';
   if (questionType === 'frq' || questionType === 'frq_ai') {
       placement = 'homework';
   }
   // الأسئلة الاكمل (fill in the blank) غالباً تكون frq أو frq_ai
   // إذا كان هناك تمييز آخر لنوع الاكمل أضفه هنا
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
   let finalTitle = slideData.isQuestion ? (CONFIG.FINAL_SLIDE_TITLES[slideData.placement] || '  سؤال  ') : slideData.title;
   addStyledTitle(slide, finalTitle, slideData.isCheckpoint);
   let contentShape = null;
   let imageShape = null;
   const hasNote = !!(slideData.note && slideData.note.trim());
   if (slideData.imageName && imageFolder) {
       imageShape = addStyledImage(slide, slideData.imageName, imageFolder, hasNote);
   } else if (slideData.imageUrl) {
       imageShape = addStyledImageFromUrl(slide, slideData.imageUrl, hasNote);
   } else if (slideData.isQuestion) {
       contentShape = addQuestionContent(slide, slideData, hasNote);
   }
   const idTextLines = [];
   if (slideData.isQuestion) {
     if (slideData.placement === 'example' || slideData.placement === 'interactive example') {
       idTextLines.push('slide_id: new');
       idTextLines.push(`question_id: ${slideData.questionId}`);
       idTextLines.push('homework: true');
     } else if (slideData.placement === 'not_homework') {
       if (slideData.questionId) idTextLines.push(`question_id: ${slideData.questionId}`);
       idTextLines.push('question_placement: not_homework');
     } else {
       if (slideData.questionId) idTextLines.push(`question_id: ${slideData.questionId}`);
       idTextLines.push(`question_placement: ${slideData.placement || 'live'}`);
       if (slideData.isCheckpoint) {
         idTextLines.push('checkpoint');
         idTextLines.push('required_correct: 3');
         idTextLines.push('attempt_window: 5');
       }
     }
   } else {
     if (slideData.showSectionId && slideData.sectionId) idTextLines.push(`section_id: ${slideData.sectionId}`);
     if (slideData.slideId) idTextLines.push(`slide_id: ${slideData.slideId}`);
   }
   if (idTextLines.length > 0) {
       addIdBox(slide, idTextLines.join('\n'), slideData.isCheckpoint);
   }
   // --- إضافة الملاحظة في النهاية بعد جميع العناصر ---
   if (hasNote) {
     try {
       Utilities.sleep(100);
       if (slideData.isQuestion && contentShape) {
         // ضع الملاحظة تحت شكل السؤال مباشرة
         const noteTop = contentShape.getTop() + contentShape.getHeight() + 20;
         addNoteShape(slide, slideData.note, noteTop);
       } else if (imageShape) {
         // ضع الملاحظة تحت الصورة مباشرة
         const noteTop = imageShape.getTop() + imageShape.getHeight() + 20;
         addNoteShape(slide, slideData.note, noteTop);
       } else {
         addNoteShape(slide, slideData.note);
       }
     } catch (e) {
       Logger.log('Error adding note shape: ' + e);
     }
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
  function addStyledImage(slide, imageName, imageFolder, hasNote) {
   try {
       const files = imageFolder.getFilesByName(imageName);
       if (files.hasNext()) {
           const imageBlob = files.next().getBlob();
           return addStyledImageFromBlob(slide, imageBlob, hasNote);
       } else {
           Logger.log(`Image not found in Drive: ${imageName}`);
       }
   } catch (e) {
       Logger.log(`Error adding image from Drive ${imageName}: ${e.message}`);
   }
   return null;
}
function addStyledImageFromUrl(slide, imageUrl, hasNote) {
   try {
       const imageBlob = UrlFetchApp.fetch(imageUrl).getBlob();
       return addStyledImageFromBlob(slide, imageBlob, hasNote);
   } catch (e) {
       Logger.log(`Error fetching image from URL ${imageUrl}: ${e.message}`);
   }
   return null;
}
function addStyledImageFromBlob(slide, imageBlob, hasNote) {
   try {
       const image = slide.insertImage(imageBlob);
       const MARGIN = 20;
       const HEADER_HEIGHT = 90;
       const NOTE_HEIGHT = 80;
       const NOTE_MARGIN = 20;
       const presentation = SlidesApp.getActivePresentation();
       const pageWidth = presentation.getPageWidth();
       const pageHeight = presentation.getPageHeight();
       const availableWidth = pageWidth - (MARGIN * 2);
       let availableHeight = pageHeight - HEADER_HEIGHT - MARGIN;
       if (hasNote) {
           availableHeight = availableHeight - NOTE_HEIGHT - NOTE_MARGIN;
       }
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
       return image;
   } catch (e) {
       Logger.log(`Error adding image blob: ${e.message}`);
   }
   return null;
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
  function addQuestionContent(slide, slideData, hasNote) {
   if (!slideData.isQuestion || !slideData.questionBody) return null;
   const presentation = SlidesApp.getActivePresentation();
   const pageWidth = presentation.getPageWidth();
   const pageHeight = presentation.getPageHeight();
   const MARGIN = 60;
   const CONTENT_TOP = 110;
   const BOX_BG = '#f8f9fa';
   const BOX_BORDER = '#e9ecef';
   const NOTE_HEIGHT = 80;
   const NOTE_MARGIN = 20;
   let contentHeight = pageHeight - CONTENT_TOP - MARGIN;
   if (hasNote) {
       contentHeight = contentHeight - NOTE_HEIGHT - NOTE_MARGIN;
   }
   const contentWidth = pageWidth - (MARGIN * 2);
   const contentShape = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, MARGIN, CONTENT_TOP, contentWidth, contentHeight);
   contentShape.getFill().setSolidFill(BOX_BG);
   contentShape.getBorder().setWeight(2).getLineFill().setSolidFill(BOX_BORDER);
   const textRange = contentShape.getText();
   let fullText = slideData.questionBody;
   if (slideData.answerOptions && slideData.answerOptions.length > 0) {
       fullText += '\n\n  الإجابات  :\n\n';
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
           // حجم الخط الرئيسي
           paragraphs[0].getRange().getTextStyle().setFontFamily('Arial').setFontSize(hasNote ? 16 : 20).setBold(true).setForegroundColor('#374151');
       }
       for (let i = 1; i < paragraphs.length; i++) {
           const paraText = paragraphs[i].getRange().asString().trim();
           const paraRange = paragraphs[i].getRange();
           if (paraText === '  الإجابات  :') {
               paraRange.getTextStyle().setFontFamily('Arial').setFontSize(hasNote ? 13 : 16).setBold(true).setForegroundColor('#0072b4');
           } else if (paraText.match(/^[A-Z]\./) || paraText.match(/^✓ [A-Z]\./)) {
               const isCorrect = paraText.startsWith('✓');
               paraRange.getTextStyle().setFontFamily('Arial').setFontSize(hasNote ? 14 : 18).setBold(isCorrect).setForegroundColor(isCorrect ? '#16a34a' : '#374151');
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
   return contentShape;
}


  function addNoteShape(slide, noteText, customTop) {
   const presentation = SlidesApp.getActivePresentation();
   const pageWidth = presentation.getPageWidth();
   const pageHeight = presentation.getPageHeight();
   const MARGIN = 60;
   const NOTE_HEIGHT = 80;
   const noteWidth = pageWidth - (MARGIN * 2);
   // الموقع الافتراضي (أسفل الشريحة)
   let noteTop = (typeof customTop === 'number') ? customTop : (pageHeight - NOTE_HEIGHT - MARGIN);
  
   try {
       if (typeof customTop !== 'number') {
           // البحث عن شكل السؤال أو الصورة لتحديد الموقع المناسب (نفس المنطق القديم)
           const shapes = slide.getShapes();
           let maxBottom = 110;
           for (let i = 0; i < shapes.length; i++) {
               const shape = shapes[i];
               const shapeTop = shape.getTop();
               const shapeHeight = shape.getHeight();
               const shapeBottom = shapeTop + shapeHeight;
               if (shape.getText && shape.getText().asString().includes('📝 ملحوظة:')) {
                   continue;
               }
               if (shape.getText && shape.getText().asString().trim()) {
                   maxBottom = Math.max(maxBottom, shapeBottom);
               }
           }
           noteTop = maxBottom + 20;
           if (noteTop + NOTE_HEIGHT > pageHeight - MARGIN) {
               noteTop = pageHeight - NOTE_HEIGHT - MARGIN;
           }
       }
      
   } catch (e) {
       Logger.log(`Error calculating note position: ${e.message}`);
   }
  
   // إنشاء شكل الملاحظة
   const noteShape = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, MARGIN, noteTop, noteWidth, NOTE_HEIGHT);
   noteShape.getFill().setSolidFill('#fff3cd');
   noteShape.getBorder().setWeight(1).getLineFill().setSolidFill('#ffeaa7');
  
   // إضافة النص
   const textRange = noteShape.getText();
   textRange.setText(`📝 ملحوظة:\n${noteText}`);
  
   try {
       // تنسيق النص
       const paragraphs = textRange.getParagraphs();
       paragraphs.forEach(p => {
           const style = p.getParagraphStyle();
           if (style) {
               style.setParagraphAlignment(SlidesApp.ParagraphAlignment.RIGHT);
           }
       });
      
       // تنسيق العنوان "ملحوظة"
       if (paragraphs.length > 0) {
           const titleRange = paragraphs[0].getRange();
           titleRange.getTextStyle().setFontFamily('Arial').setFontSize(14).setBold(true).setForegroundColor('#856404');
       }
      
       // تنسيق نص الملاحظة
       if (paragraphs.length > 1) {
           const noteRange = paragraphs[1].getRange();
           noteRange.getTextStyle().setFontFamily('Arial').setFontSize(12).setBold(false).setForegroundColor('#856404');
       }
      
   } catch (e) {
       Logger.log(`Error styling note shape: ${e.message}`);
   }
  
   // توسيط الشكل
   noteShape.setLeft((pageWidth - noteWidth) / 2);
   noteShape.setTop(noteTop);
  }
  // =====================
  //  Sheet & Utility Functions
  // =====================
  function importFromSheet(sheetUrl) {
   const ui = SlidesApp.getUi();
   try {
       const fileIdMatch = sheetUrl.match(/[-\w]{25,}/);
       if (!fileIdMatch) throw new Error('رابط الشيت غير صالح.');
       const fileId = fileIdMatch[0];
       const ss = SpreadsheetApp.openById(fileId);
       const sheet = ss.getSheets()[0];
       const data = sheet.getDataRange().getValues();
       if (data.length < 2) {
           ui.alert('الشيت فارغ أو يحتوي على صف العناوين فقط.');
           return;
       }
       const headers = data[0].map(h => (h || '').toString().trim());
       const requiredHeaders = ['question_id', 'question_text', 'answer_options', 'correct_answer'];
       const headerIndices = {};
       for (const h of requiredHeaders) {
           const index = headers.indexOf(h);
           if (index === -1) {
               throw new Error(`العمود المفقود: ${h}`);
           }
           headerIndices[h] = index;
       }
       headerIndices['image_url'] = headers.indexOf('image_url'); // Optional
       const importedIds = getImportedSlidesIds();
       const questionsToImport = [];
       for (let i = 1; i < data.length; i++) {
           const row = data[i];
           const questionId = row[headerIndices.question_id].toString().trim();
           if (questionId && !importedIds[questionId]) {
               questionsToImport.push({
                   isQuestion: true,
                   questionId: questionId,
                   questionBody: row[headerIndices.question_text].toString().trim(),
                   answerOptions: row[headerIndices.answer_options].toString().split(',').map(s => s.trim()),
                   correctAnswerIndex: parseInt(row[headerIndices.correct_answer], 10),
                   imageUrl: headerIndices.image_url !== -1 ? row[headerIndices.image_url].toString().trim() : null,
                   placement: 'live'
               });
           }
       }
       if (questionsToImport.length === 0) {
           ui.alert('لم يتم العثور على أسئلة جديدة للاستيراد.');
           return;
       }
       const presentation = SlidesApp.getActivePresentation();
       questionsToImport.forEach(qData => {
           processSingleSlide(presentation, qData, null); // No imageFolder needed
       });
       const properties = PropertiesService.getUserProperties();
       questionsToImport.forEach(q => {
           importedIds[q.questionId] = true;
       });
       properties.setProperty(CONFIG.PROPERTIES.IMPORTED_IDS, JSON.stringify(importedIds));
       ui.alert(`تم استيراد ${questionsToImport.length} سؤال بنجاح.`);
   } catch (e) {
       Logger.log(`Error in importFromSheet: ${e.stack}`);
       ui.alert(`حدث خطأ أثناء الاستيراد من الشيت: ${e.message}`);
   }
  }
  function getSheetRows(sheetUrl) {
   try {
       const fileIdMatch = sheetUrl.match(/[-\w]{25,}/);
       if (!fileIdMatch) throw new Error('  رابط   الشيت   غير   صالح  ');
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
               throw new Error(`  يجب   أن   يحتوي   الشيت   على   الأعمدة   المطلوبة .  العمود   المفقود : ${h}`);
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
  function addToDeletedQuestions(id) {
   if (!id) return;
   try {
     const properties = PropertiesService.getUserProperties();
     let deleted = properties.getProperty('DELETED_QUESTIONS');
     let arr = deleted ? JSON.parse(deleted) : [];
     if (!arr.includes(id)) {
       arr.push(id);
       properties.setProperty('DELETED_QUESTIONS', JSON.stringify(arr));
     }
   } catch (e) {
     Logger.log('Error in addToDeletedQuestions: ' + e);
   }
  }
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 

