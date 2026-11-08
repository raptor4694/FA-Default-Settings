// ==UserScript==
// @name        FurAffinity Default Post Settings
// @namespace   furaffinity-improvements
// @version     0.2
// @description Adds default post settings to FurAffinity
// @author      https://github.com/Raptor4694
// @run-at      document-ready
// @match       https://www.furaffinity.net/submit/finalize/
// @match       https://www.furaffinity.net/controls/submissions/changeinfo/*/
// @require     http://code.jquery.com/jquery-latest.js
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// ==/UserScript==
"use strict";
const isClassic = document.body.getAttribute('data-static-path') == "/themes/classic";
console.log(`${isClassic ? "Classic" : "Modern"} theme detected!`);
const page = document.URL.substring(document.URL.indexOf("furaffinity.net/") + 16);
/**
 * Outputs a message to the console, prepended with a tag indicating the message
 * is from this userscript.
 * @param data The message to log
 */
function userscriptLog(...data) {
    console.log("[FurAffinityDefaultSettings] ", ...data);
}
/**
 * Converts all tags and codes to modern format.
 * @param text The text to convert
 * @returns the converted text
 */
function fixTagsAndCodes(text) {
    return text;
}
/**
 * Extracts a username from a link such as "/user/raptor4694/"
 * @param link The link
 * @returns The username in the link
 */
function getUsernameFromRelativeLink(link) {
    return /\/user\/([-~a-z0-9]+)\/?/g.exec(link)?.[1] ?? null;
}
/**
 * Extracts a username from an HTMLElement's 'href' attribute
 * @param element The element
 */
function getUsernameFromHref(element) {
    let href = element?.getAttribute('href');
    return href == null ? null : getUsernameFromRelativeLink(href);
}
/**
 * @returns The currently logged in user's username or null.
 */
function getUsername() {
    let username = getUsernameFromHref($(`a[href^="/user/"]`).get(0));
    if (username != null)
        userscriptLog(`Setting user: '${username}'`);
    return username;
}
const GENERAL_RADIO_INDEX = 0;
const MATURE_RADIO_INDEX = 2;
const ADULT_RADIO_INDEX = 1;
// Input element getters
/// curiously enough, these work no matter which template is used
const categoryDropdown = $(`select[name="cat"]`).get(0);
const themeDropdown = $(`select[name="atype"]`).get(0);
const speciesDropdown = $(`select[name="species"]`).get(0);
const genderDropdown = $(`select[name="gender"]`).get(0);
var getRatingRadioButton = (rating) => $(`input.radio[name="rating"][value="${rating}"]`).get(0);
const ratingRadioButtons = $(`input.radio[name="rating"]`);
const generalRadioButton = ratingRadioButtons.get(GENERAL_RADIO_INDEX);
const matureRadioButton = ratingRadioButtons.get(MATURE_RADIO_INDEX);
const adultRadioButton = ratingRadioButtons.get(ADULT_RADIO_INDEX);
const disableCommentsCheckbox = $(`input[name="lock_comments"]`).get(0);
const putInScrapsCheckbox = $(`input[name="scrap"]`).get(0);
const folderCheckboxes = $(`input[name="folder_ids[]"]`);
const titleInput = $(`input[name="title"]`).get(0);
const descriptionTextArea = $(`textarea[name="message"]`).get(0);
const keywordsTextArea = $(`textarea[name="keywords"]`).get(0);
const keywordCount = $(`.keywords span`).get(0);
function isRatingUnset() {
    for (let i = 0; i < ratingRadioButtons.length; i++) {
        var radioButton = ratingRadioButtons.get(i);
        if (radioButton == undefined)
            break;
        if (radioButton.checked)
            return false;
    }
    return true;
}
/** Set defaults */
async function setDefaults() {
    // Set the default keywords
    const defaultKeywords = await GM_getValue(`${ACTIVE_USER}.defaultKeywords`, "");
    userscriptLog(`defaultKeywords = ${defaultKeywords}`);
    if (defaultKeywords && !keywordsTextArea.defaultValue) {
        keywordsTextArea.defaultValue = defaultKeywords;
        keywordCount.innerText = `${parseInt(keywordCount.innerText, 10) - defaultKeywords.length}`;
    }
    // Set the default title
    const defaultTitle = await GM_getValue(`${ACTIVE_USER}.defaultTitle`, "");
    userscriptLog(`defaultTitle = ${defaultTitle}`);
    if (defaultTitle && !titleInput.defaultValue) {
        titleInput.defaultValue = defaultTitle;
    }
    // Set the default description
    const defaultDescription = await GM_getValue(`${ACTIVE_USER}.defaultDescription`, "");
    userscriptLog(`defaultDescription = ${defaultDescription}`);
    if (defaultDescription && !descriptionTextArea.defaultValue) {
        descriptionTextArea.defaultValue = defaultDescription;
    }
    // Set the default selections for the dropdown boxes
    const defaultCategory = await GM_getValue(`${ACTIVE_USER}.defaultCategory`, 0);
    userscriptLog(`defaultCategory = ${defaultCategory}`);
    if (defaultCategory != 0) {
        categoryDropdown.selectedIndex = defaultCategory;
    }
    const defaultTheme = await GM_getValue(`${ACTIVE_USER}.defaultTheme`, 0);
    userscriptLog(`defaultTheme = ${defaultTheme}`);
    if (defaultTheme != 0) {
        themeDropdown.selectedIndex = defaultTheme;
    }
    const defaultSpecies = await GM_getValue(`${ACTIVE_USER}.defaultSpecies`, 0);
    userscriptLog(`defaultSpecies = ${defaultSpecies}`);
    if (defaultSpecies != 0) {
        speciesDropdown.selectedIndex = defaultSpecies;
    }
    const defaultGender = await GM_getValue(`${ACTIVE_USER}.defaultGender`, 0);
    userscriptLog(`defaultGender = ${defaultGender}`);
    if (defaultGender != 0) {
        genderDropdown.selectedIndex = defaultGender;
    }
    // Set the default rating
    const defaultRating = await GM_getValue(`${ACTIVE_USER}.defaultRating`, -1);
    userscriptLog(`defaultRating = ${defaultRating}`);
    if (defaultRating == -1) {
        getRatingRadioButton(defaultRating).checked = true;
    }
    // Set whether 'Disable Comments' is checked by default
    const defaultDisableComments = await GM_getValue(`${ACTIVE_USER}.defaultDisableComments`, false);
    userscriptLog(`defaultDisableComments = ${defaultDisableComments}`);
    disableCommentsCheckbox.checked = defaultDisableComments;
    // Set whether 'Put in Scraps' is checked by default
    const defaultPutInScraps = await GM_getValue(`${ACTIVE_USER}.defaultPutInScraps`, false);
    userscriptLog(`defaultPutInScraps = ${defaultPutInScraps}`);
    putInScrapsCheckbox.checked = defaultPutInScraps;
    // Set the default folders to put it in
    const defaultFolders = await GM_getValue(`${ACTIVE_USER}.defaultFolders`, "");
    userscriptLog(`defaultFolders = ${defaultFolders}`);
    if (defaultFolders) {
        const folders = defaultFolders.split(',');
        folderCheckboxes.each(function () {
            if (folders.includes(this.value)) {
                this.checked = true;
            }
        });
    }
}
function setDisabled() {
    this.disabled = true;
}
function setEnabled() {
    this.disabled = false;
}
function onThemeDropdownUpdated() {
    var options = this.selectedOptions;
    for (let i = 0; i < options.length; i++) {
        let option = options[0];
        switch (option.innerText) {
            case "Hyper":
            case "Water Sports":
                adultRadioButton.checked = true;
                ratingRadioButtons.each(setDisabled);
                break;
            case "Bondage":
                ratingRadioButtons.each(setEnabled);
                if (generalRadioButton.checked || isRatingUnset()) {
                    matureRadioButton.checked = true;
                }
                generalRadioButton.disabled = true;
                break;
            case "Gore / Macabre Art":
                ratingRadioButtons.each(setEnabled);
                if (generalRadioButton.checked || isRatingUnset()) {
                    matureRadioButton.checked = true;
                }
                break;
            default:
                ratingRadioButtons.each(setEnabled);
                break;
        }
    }
}
function addListeners() {
    themeDropdown.addEventListener('change', onThemeDropdownUpdated);
    onThemeDropdownUpdated.call(themeDropdown);
}
function createDefaultButtons(set_callback, ...names) {
    const setDefaultButton = createSetDefaultButton(set_callback);
    const removeDefaultButton = createRemoveDefaultButton(...names);
    removeDefaultButton.onclick = function (event) {
        for (let name of names) {
            GM_deleteValue(`${ACTIVE_USER}.default${name}`);
        }
        setDefaultButton.innerText = "Default unset!";
        setTimeout(() => setDefaultButton.innerText = "Set as default", 3000);
    };
    return [setDefaultButton, removeDefaultButton];
}
function createButton(title, onclick) {
    const btn = document.createElement('button');
    btn.innerText = btn.title = title;
    btn.type = 'button';
    btn.style.setProperty('font-size', '10px', 'important');
    btn.style.padding = '0px 0px 2px 0px';
    btn.style.marginLeft = '3px';
    btn.style.lineHeight = '1em';
    btn.style.verticalAlign = 'center';
    btn.className = 'button';
    if (onclick)
        btn.onclick = onclick;
    return btn;
}
function createSetDefaultButton(callback) {
    const btn = createButton("Set as default", function (event) {
        const btn = event.currentTarget;
        btn.innerText = "Default set!";
        setTimeout(() => btn.innerText = "Set as default", 3000);
        return callback.call(this, event);
    });
    btn.style.padding = '0px 13px 2px 12px';
    if (!isClassic)
        btn.style.marginLeft = '1em';
    return btn;
}
function createRemoveDefaultButton(...names) {
    const btn = createButton("🗑" /* trash bin icon */, function () {
        for (let name of names) {
            GM_deleteValue(`${ACTIVE_USER}.default${name}`);
        }
    });
    btn.title = `Remove Default ${names.join(', ')}`;
    return btn;
}
function createSetDefaultFunction(dropdown, name) {
    function setDefault() {
        GM_setValue(`${ACTIVE_USER}.default${name}`, dropdown.selectedIndex);
        userscriptLog(`Set default ${name} to ${dropdown.options[dropdown.selectedIndex].textContent}`);
    }
    setDefault.name = `setDefault${name}`;
    return setDefault;
}
var setDefaultCategory = createSetDefaultFunction(categoryDropdown, "Category");
var setDefaultTheme = createSetDefaultFunction(themeDropdown, "Theme");
var setDefaultSpecies = createSetDefaultFunction(speciesDropdown, "Species");
var setDefaultGender = createSetDefaultFunction(genderDropdown, "Gender");
var setDefaultRating = () => ratingRadioButtons.each(function () {
    if (this.checked) {
        GM_setValue(`${ACTIVE_USER}.defaultRating`, this.valueAsNumber);
        userscriptLog(`Set default Rating to ${this.nextElementSibling?.textContent}`);
    }
});
function setDefaultTitle() {
    GM_setValue(`${ACTIVE_USER}.defaultTitle`, titleInput.value);
    userscriptLog(`Set default Title to ${titleInput.value}`);
}
function setDefaultDescription() {
    GM_setValue(`${ACTIVE_USER}.defaultDescription`, descriptionTextArea.value);
    userscriptLog(`Set default Description to ${descriptionTextArea.value}`);
}
function setDefaultKeywords() {
    GM_setValue(`${ACTIVE_USER}.defaultKeywords`, keywordsTextArea.value);
    userscriptLog(`Set default Keywords to ${keywordsTextArea.value}`);
}
function setDefaultDisableComments() {
    GM_setValue(`${ACTIVE_USER}.defaultDisableComments`, disableCommentsCheckbox.checked);
    userscriptLog(`Set default DisableComments to ${disableCommentsCheckbox.checked}`);
}
function setDefaultPutInScraps() {
    GM_setValue(`${ACTIVE_USER}.defaultPutInScraps`, putInScrapsCheckbox.checked);
    userscriptLog(`Set default PutInScraps to ${putInScrapsCheckbox.checked}`);
}
var setDefaultFolders = () => {
    let folderIds = [];
    let folderNames = [];
    folderCheckboxes.each(function () {
        if (this.checked) {
            folderIds.push(this.value);
            folderNames.push(this.nextElementSibling?.textContent ?? "<error>");
        }
    });
    GM_setValue(`${ACTIVE_USER}.defaultFolders`, folderIds.join(','));
    userscriptLog(`Set default Folders to ${folderNames.join(', ')}`);
};
// Main Procedures
/** Main procedure for the Modern theme */
async function main_modernTheme() {
    userscriptLog("Theme detected: Modern");
    setDefaults();
    addListeners();
    /*** Add buttons to save and remove defaults ***/
    $(`h4`).each(function () {
        switch (this.innerText) {
            case "Category":
                this.append(...createDefaultButtons(setDefaultCategory, 'Category'));
                break;
            case "Theme":
                this.append(...createDefaultButtons(setDefaultTheme, 'Theme'));
                break;
            case "Species":
                this.append(...createDefaultButtons(setDefaultSpecies, 'Species'));
                break;
            case "Gender":
            case "Genders":
                this.append(...createDefaultButtons(setDefaultGender, 'Gender'));
                break;
            case "Rating":
            case "Submission Rating":
                this.append(...createDefaultButtons(setDefaultRating, 'Rating'));
                break;
            case "Title":
                this.append(...createDefaultButtons(setDefaultTitle, 'Title'));
                break;
            case "Description":
            case "Submission Description":
                this.append(...createDefaultButtons(setDefaultDescription, 'Description'));
                if (descriptionTextArea.defaultValue) {
                    this.append(createButton(":iconusername: → @@username", function (event) {
                        const descriptionTextArea = event.currentTarget;
                        descriptionTextArea.value = descriptionTextArea.value.replace(/(?<!@):icon([-~a-z0-9]+):(?![-~a-z0-9])/g, '@@$1');
                    }), createButton(":linkusername: → @username", function (event) {
                        const descriptionTextArea = event.currentTarget;
                        descriptionTextArea.value = descriptionTextArea.value.replace(/(?<!@):link([-~a-z0-9]+):(?![-~a-z0-9])/g, '@$1');
                    }), createButton(":usernameicon: → @@username", function (event) {
                        const descriptionTextArea = event.currentTarget;
                        descriptionTextArea.value = descriptionTextArea.value.replace(/(?<!@):([-~a-z0-9]+)icon:(?![-~a-z0-9])/g, '@$1')
                            .replace(/:([-~a-z0-9]+)icon:/g, ':icon$1:');
                    }));
                }
                break;
            default:
                if (this.innerText.startsWith("Keywords")) {
                    this.append(...createDefaultButtons(setDefaultKeywords, 'Keywords'));
                }
                break;
        }
    });
    $('.section-header > h2').each(function () {
        switch (this.innerText) {
            case "Submission Options":
                this.append(...createDefaultButtons(() => {
                    setDefaultDisableComments();
                    setDefaultPutInScraps();
                }, 'DisableComments', 'PutInScraps'));
                break;
            case "Assign to Folders":
                this.append(...createDefaultButtons(setDefaultFolders, 'Folders'));
                break;
        }
    });
}
/** Main procedure for the Classic theme */
function main_classicTheme() {
    userscriptLog("Theme detected: Classic");
    setDefaults();
    addListeners();
    /*** Add buttons to save and remove defaults ***/
    titleInput.after(document.createElement('br'), ...createDefaultButtons(setDefaultTitle, 'Title'));
    descriptionTextArea.after(document.createElement('br'), ...createDefaultButtons(setDefaultDescription, 'Description'));
    disableCommentsCheckbox.parentElement.after(document.createElement('br'), ...createDefaultButtons(setDefaultDisableComments, 'DisableComments'));
    const div = document.createElement('div');
    div.append(...createDefaultButtons(setDefaultKeywords, 'Keywords'));
    div.style.display = 'inline-block';
    div.style.float = 'left';
    keywordCount.insertAdjacentElement('afterbegin', div);
    keywordCount.after(document.createElement('br'));
    categoryDropdown.after(document.createElement('br'), ...createDefaultButtons(setDefaultCategory, 'Category'));
    putInScrapsCheckbox.after(document.createElement('br'), ...createDefaultButtons(setDefaultPutInScraps, 'PutInScraps'));
    themeDropdown.after(document.createElement('br'), ...createDefaultButtons(setDefaultTheme, 'Theme'));
    speciesDropdown.after(document.createElement('br'), ...createDefaultButtons(setDefaultSpecies, 'Species'));
    genderDropdown.after(document.createElement('br'), ...createDefaultButtons(setDefaultGender, 'Gender'));
    getRatingRadioButton(1).parentElement.querySelector(`#MAImage`).previousElementSibling.previousElementSibling.before(document.createElement('br'), ...createDefaultButtons(setDefaultRating, 'Rating'));
    $(`.pseudo_header`).each(function () {
        if (this.innerText == "Assign the submission to existing folders (optional)") {
            const [btn, btn2] = createDefaultButtons(setDefaultFolders, 'Folders');
            btn.style.marginLeft = '1em';
            this.append(btn, btn2);
        }
    });
}
const ACTIVE_USER = getUsername();
if (ACTIVE_USER) { // no point in running if there's no user logged in
    if (isClassic) {
        main_classicTheme();
    }
    else {
        main_modernTheme();
    }
    // actually wait how would someone get to this page if they weren't logged in???
}
