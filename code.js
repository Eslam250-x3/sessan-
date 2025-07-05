/**
 * @OnlyCurrentDoc
 *
 * Final Version: This file contains the complete server-side Google Apps Script logic.
 * It handles fetching data from Google Drive, parsing HTML, creating slides,
 * and interacting with Google Sheets.
 */


// =====================
//  Global Configuration
// =====================
const CONFIG = {
    UI: {
        MENU_TITLE: '📥 استيراد HTML',
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
        ID_BOX_FONT_COLOR: '#000000', // Black for keys
        ID_BOX_VALUE_FONT_COLOR: '#FF0000', // Red for values
        ID_BOX_WIDTH: 220,
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
        IMPORTED_IDS: 'IMPORTED_SLIDE_IDS',
        COLLAPSE_STATE: 'COLLAPSE_STATE'
    },
    PLACEMENTS: ['live', 'example', 'ai', 'homework', 'interactive_example'],
    FINAL_SLIDE_TITLES: {
        'live': 'سؤال',
        'ai': 'سؤال',
        'homework': 'سؤال',
        'example': 'مثال',
        'interactive_example': 'سؤال'
    }
};


// =====================
//  UI & Menu Functions
// =====================


/**
 * Adds a custom menu to the Google Slides UI when the presentation is opened.
 */
function onOpen(e) {
    SlidesApp.getUi()
        .createMenu(CONFIG.UI.MENU_TITLE)
        .addItem(CONFIG.UI.IMPORT_ITEM, 'showImportDialog')
        .addToUi();
}


/**
 * Shows a modal dialog with the HTML user interface.
 */
function showImportDialog() {
    const htmlOutput = HtmlService.createHtmlOutputFromFile('Dialog')
        .setWidth(CONFIG.UI.DIALOG_WIDTH)
        .setHeight(CONFIG.UI.DIALOG_HEIGHT);
    SlidesApp.getUi().showModalDialog(htmlOutput, CONFIG.UI.DIALOG_TITLE);
}


// =====================
//  Data Persistence Functions
// =====================


/**
 * Saves user-provided data (HTML file URL, image folder ID) to UserProperties.
 */
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


/**
 * Retrieves saved user data from UserProperties.
 */
function getSavedUserData() {
    const properties = PropertiesService.getUserProperties();
    return {
        htmlFileUrl: properties.getProperty('HTML_FILE_URL') || '',
        imageFolderId: properties.getProperty('IMAGE_FOLDER_ID') || ''
    };
}


/**
 * Saves the collapse state of header, footer, and preview controls.
 * @param {boolean} headerCollapsed Whether the header is collapsed.
 * @param {boolean} footerCollapsed Whether the footer is collapsed.
 * @param {boolean} previewControlsCollapsed Whether the preview controls are collapsed.
 */
function saveCollapseState(headerCollapsed, footerCollapsed, previewControlsCollapsed) {
    try {
        const properties = PropertiesService.getUserProperties();
        const collapseState = {
            headerCollapsed: headerCollapsed || false,
            footerCollapsed: footerCollapsed || false,
            previewControlsCollapsed: previewControlsCollapsed || false
        };
        properties.setProperty(CONFIG.PROPERTIES.COLLAPSE_STATE, JSON.stringify(collapseState));
        return true;
    } catch (error) {
        Logger.log(`Error saving collapse state: ${error.toString()}`);
        return false;
    }
}

/**
 * Retrieves the saved collapse state of header, footer, and preview controls.
 * @return {Object} An object containing the collapse state.
 */
function getCollapseState() {
    try {
        const properties = PropertiesService.getUserProperties();
        const collapseStateJson = properties.getProperty(CONFIG.PROPERTIES.COLLAPSE_STATE);
        if (collapseStateJson) {
            return JSON.parse(collapseStateJson);
        }
        return {
            headerCollapsed: false,
            footerCollapsed: false,
            previewControlsCollapsed: false
        };
    } catch (error) {
        Logger.log(`Error getting collapse state: ${error.toString()}`);
        return {
            headerCollapsed: false,
            footerCollapsed: false,
            previewControlsCollapsed: false
        };
    }
}


// =====================
//  Frontend-Callable Functions
// =====================


/**
 * Fetches and parses the HTML file to generate slide data for the preview.
 * This function is called from the client-side JavaScript.
 * @param {string} fileUrl The URL of the Google Drive HTML file.
 * @param {string} folderId The ID of the Google Drive folder containing images.
 * @return {Array<Object>|Object} An array of slide data objects or an error object.
 */
function getSlidesForPreview(fileUrl, folderId) {
    try {
        if (!fileUrl || !folderId) throw new Error('رابط الملف ومعرف المجلد مطلوبان.');
        saveUserData(fileUrl, folderId);


        const fileId = (fileUrl.match(CONFIG.REGEX.DRIVE_FILE_ID) || [])[0];
        if (!fileId) throw new Error('رابط ملف HTML غير صالح.');
       
        const htmlContent = DriveApp.getFileById(fileId).getBlob().getDataAsString('UTF-8');
        if (!htmlContent.trim()) throw new Error('ملف HTML فارغ.');
       
        const slideHtmlSections = htmlContent.match(CONFIG.REGEX.SLIDE_SECTION) || [];
        if (slideHtmlSections.length === 0) return [];


        const imageFolder = DriveApp.getFolderById(folderId);
        const imageFiles = imageFolder.getFiles();
        const imageMap = new Map();
        while (imageFiles.hasNext()) {
            const file = imageFiles.next();
            imageMap.set(file.getName(), file.getBlob());
        }


        const slidesData = slideHtmlSections.map((slideHtml, index) => {
            const slideData = parseSlideHtml(slideHtml, index);
            if (slideData.imageName && imageMap.has(slideData.imageName)) {
                const blob = imageMap.get(slideData.imageName);
                // Check image size to avoid exceeding base64 limits (4MB)
                if (blob.getBytes().length < 4 * 1024 * 1024) {
                    slideData.imageUrl = `data:${blob.getContentType()};base64,${Utilities.base64Encode(blob.getBytes())}`;
                }
            }
            return slideData;
        });


        return slidesData;


    } catch (e) {
        Logger.log(`Error in getSlidesForPreview: ${e.stack}`);
        return { error: `فشل تحميل المعاينة: ${e.message}` };
    }
}


/**
 * Imports the selected slides into the active Google Slides presentation.
 * @param {Array<Object>} selectedSlides An array of slide data objects to import.
 * @param {string} folderId The ID of the image folder.
 * @return {Array<string>|Object} An array of imported slide IDs or an error object.
 */
function importSelectedSlides(selectedSlides, folderId) {
    if (!selectedSlides || selectedSlides.length === 0) {
        return { error: 'لم يتم تحديد أي شرائح للاستيراد.' };
    }
    try {
        const presentation = SlidesApp.getActivePresentation();
        const imageFolder = DriveApp.getFolderById(folderId);
       
        selectedSlides.forEach(slideData => {
            processSingleSlide(presentation, slideData, imageFolder);
        });


        // Store IDs of imported slides to prevent re-importing
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
        Logger.log(`Import failed: ${e.stack}`);
        return { error: `❌ حدث خطأ أثناء الاستيراد: ${e.message}` };
    }
}


// =====================
//  Helper & Processing Functions
// =====================


/**
 * Parses a single HTML <section> to extract slide data.
 * @param {string} slideHtml The HTML content of a single slide section.
 * @param {number} index The index of the slide for fallback titles.
 * @return {Object} A structured object containing the slide's data.
 */
function parseSlideHtml(slideHtml, index) {
    const cleanHtmlText = (text) => text ? text.replace(/<p.*?>/g, '\n').replace(/<.*?>/g, ' ').replace(/\s+/g, ' ').trim() : '';


    const titleMatch = slideHtml.match(CONFIG.REGEX.TITLE_TEXT);
    const originalTitle = titleMatch ? cleanHtmlText(titleMatch[1]) : `الشريحة ${index + 1}`;
    const isQuestion = CONFIG.REGEX.QUESTION_TYPE.test(slideHtml);
    const placement = (slideHtml.match(CONFIG.REGEX.PLACEMENT) || [])[1] || 'live';
   
    let title = originalTitle;
    if (isQuestion) {
        title = (placement === 'interactive_example') ? 'سؤال' : `${placement}: ${originalTitle}`;
    }


    let questionBody = null;
    let answerOptions = [];
    if (isQuestion) {
        const bodyMatch = slideHtml.match(CONFIG.REGEX.QUESTION_BODY);
        if (bodyMatch && bodyMatch[1]) {
            questionBody = cleanHtmlText(bodyMatch[1]);
        }
        const answerRegex = new RegExp(CONFIG.REGEX.ANSWER_OPTIONS.source, 'g');
        let optionMatch;
        while ((optionMatch = answerRegex.exec(slideHtml)) !== null) {
            answerOptions.push(cleanHtmlText(optionMatch[1]));
        }
    }


    const sectionTitleMatch = slideHtml.match(CONFIG.REGEX.SECTION_TITLE);
    const sectionTitle = sectionTitleMatch ? sectionTitleMatch[1].replace(/<.*?>/g, '').trim() : null;


    return {
        html: slideHtml,
        title: title,
        originalTitle: originalTitle,
        imageName: (slideHtml.match(CONFIG.REGEX.IMAGE_SRC) || [])[1] || null,
        imageUrl: null, // Will be populated with base64 data by the client
        sectionId: (slideHtml.match(CONFIG.REGEX.SECTION_ID) || [])[1] || null,
        slideId: (slideHtml.match(CONFIG.REGEX.SLIDE_ID) || [])[1] || null,
        questionId: isQuestion ? originalTitle : null,
        sectionType: (slideHtml.match(CONFIG.REGEX.SECTION_TYPE) || [])[1] || null,
        sectionTitle: sectionTitle,
        placement: placement,
        isQuestion: isQuestion,
        showSectionId: false, // Client-side state
        questionType: (slideHtml.match(CONFIG.REGEX.QUESTION_TYPE) || [])[1] || null,
        questionBody: questionBody,
        answerOptions: answerOptions,
        isCheckpoint: false // Client-side state
    };
}


/**
 * Processes a single slide data object and creates the corresponding slide in the presentation.
 * @param {Presentation} presentation The active Google Slides presentation.
 * @param {Object} slideData The data for the slide to be created.
 * @param {Folder} imageFolder The Google Drive folder containing images.
 */
function processSingleSlide(presentation, slideData, imageFolder) {
    const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);


    let finalTitle = slideData.isQuestion
        ? (CONFIG.FINAL_SLIDE_TITLES[slideData.placement] || 'سؤال')
        : slideData.title;
    addStyledTitle(slide, finalTitle, slideData.isCheckpoint);


    if (slideData.imageName) {
        addStyledImage(slide, slideData.imageName, imageFolder);
    } else if (slideData.isQuestion) {
        addQuestionContent(slide, slideData);
    }


    const idTextLines = [];
    if (slideData.isQuestion) {
        if (slideData.questionId) idTextLines.push(`question_id: ${slideData.questionId}`);
        idTextLines.push(`question_placement: ${slideData.placement}`);
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


/**
 * Adds and styles the main title shape on a slide.
 */
function addStyledTitle(slide, title, isCheckpoint) {
    if (!title || !title.trim()) return;
    const pageWidth = SlidesApp.getActivePresentation().getPageWidth();
    const ID_BOX_WIDTH = CONFIG.LAYOUT.ID_BOX_WIDTH;
   
    const idBoxHeight = isCheckpoint ? 70 : 50;
    const TOP_POSITION = 10;
    const titleWidth = pageWidth - ID_BOX_WIDTH - 30; // 10px margin on each side + 10px gap
    const titleLeft = ID_BOX_WIDTH + 20;


    const titleShape = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, titleLeft, TOP_POSITION, titleWidth, idBoxHeight);
    titleShape.getFill().setSolidFill(CONFIG.UI.TITLE_FILL_COLOR);
    titleShape.getBorder().setTransparent();
   
    const textRange = titleShape.getText();
    textRange.setText(title);
    textRange.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
    textRange.getRuns().forEach(run => {
        run.getTextStyle().setFontFamily('Arial').setFontSize(24).setBold(true).setForegroundColor(CONFIG.UI.TITLE_FONT_COLOR);
    });
}


/**
 * Adds and styles an image on a slide, fitting it to available space.
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
        Logger.log(`Error adding image ${imageName}: ${e.message}`);
    }
}


/**
 * Deletes the property that stores imported slide IDs.
 */
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


/**
 * Retrieves the map of already imported slide IDs.
 */
function getImportedSlidesIds() {
    const properties = PropertiesService.getUserProperties();
    const importedIdsJson = properties.getProperty(CONFIG.PROPERTIES.IMPORTED_IDS) || '{}';
    return JSON.parse(importedIdsJson);
}


/**
 * Adds and styles the ID box on the top-left of a slide.
 */
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
    
    // Set alignment for each paragraph individually to avoid API issues
    try {
        textRange.getParagraphs().forEach(paragraph => {
            try {
                paragraph.getRange().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.LEFT);
            } catch (e) {
                // Fallback: skip alignment if it fails
                Logger.log(`Alignment failed for paragraph: ${e.message}`);
            }
        });
    } catch (e) {
        Logger.log(`Paragraph alignment failed: ${e.message}`);
    }


    const overallStyle = textRange.getTextStyle();
    overallStyle.setFontFamily('Noto Naskh Arabic');
    overallStyle.setFontSize(10);


    textRange.getParagraphs().forEach(paragraph => {
        const paraText = paragraph.getRange().asString();
        const colonIndex = paraText.indexOf(':');
        if (colonIndex !== -1) {
            paragraph.getRange().getRange(0, colonIndex + 1).getTextStyle().setBold(true).setForegroundColor(ID_BOX_FONT_COLOR);
            paragraph.getRange().getRange(colonIndex + 1, paraText.length).getTextStyle().setBold(false).setForegroundColor(ID_BOX_VALUE_FONT_COLOR);
        } else {
            paragraph.getRange().getTextStyle().setBold(true).setForegroundColor(ID_BOX_FONT_COLOR);
        }
    });
}


/**
 * Adds and styles the question content (body and answers) on a slide.
 */
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
            fullText += `${String.fromCharCode(65 + i)}. ${opt}\n`;
        });
    }
    textRange.setText(fullText);
   
    // Set alignment for each paragraph individually to avoid API issues
    try {
        textRange.getParagraphs().forEach(paragraph => {
            try {
                paragraph.getRange().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.RIGHT);
            } catch (e) {
                // Fallback: skip alignment if it fails
                Logger.log(`Alignment failed for paragraph: ${e.message}`);
            }
        });
    } catch (e) {
        Logger.log(`Paragraph alignment failed: ${e.message}`);
    }


    const paragraphs = textRange.getParagraphs();
    if (paragraphs.length > 0) {
        paragraphs[0].getRange().getTextStyle().setFontFamily('Arial').setFontSize(20).setBold(true).setForegroundColor('#374151');
    }
 
    for (let i = 1; i < paragraphs.length; i++) {
        const paraText = paragraphs[i].getRange().asString().trim();
        const paraRange = paragraphs[i].getRange();
        if (paraText === 'الإجابات:') {
            paraRange.getTextStyle().setFontFamily('Arial').setFontSize(16).setBold(true).setForegroundColor('#0B5FA5');
        } else if (paraText.match(/^[A-Z]\./)) {
            paraRange.getTextStyle().setFontFamily('Arial').setFontSize(18).setBold(false).setForegroundColor('#374151');
        }
    }
   
    contentShape.setLeft((pageWidth - contentWidth) / 2);
    contentShape.setTop(CONTENT_TOP);
}


/**
 * Fetches and parses data from a specified Google Sheet.
 * @param {string} sheetUrl The URL of the Google Sheet.
 * @return {Array<Object>|Object} An array of row objects or an error object.
 */
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
       
        for(const h of requiredHeaders) {
            const index = headers.indexOf(h);
            if(index === -1) {
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
        }).filter(Boolean); // Filter out null rows
    } catch (e) {
        Logger.log(`getSheetRows Error: ${e.stack}`);
        return { error: e.message };
    }
}



