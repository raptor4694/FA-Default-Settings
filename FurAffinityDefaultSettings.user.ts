// ==UserScript==
// @name        FurAffinity Default Post Settings
// @namespace   furaffinity-improvements
// @version     0.2
// @description Adds default post settings to FurAffinity
// @author      https://github.com/Raptor4694
// @run-at      document-ready
// @match       https://www.furaffinity.net/submit/finalize/
// @require     http://code.jquery.com/jquery-latest.js
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// ==/UserScript==
"use strict"

declare function GM_getValue(name: string, defaultValue: string): Promise<string>
declare function GM_getValue(name: string, defaultValue: number): Promise<number>
declare function GM_getValue(name: string, defaultValue: boolean): Promise<boolean>
declare function GM_setValue(name: string, value: string | number | boolean): Promise<void>
declare function GM_deleteValue(name: string): Promise<void>

const isClassic = document.body.getAttribute('data-static-path') == "/themes/classic"
console.log(`${isClassic? "Classic" : "Modern"} theme detected!`)

const page = document.URL.substring(document.URL.indexOf("furaffinity.net/") + 16)

/**
 * Extracts a username from a link such as "/user/raptor4694/"
 * @param link The link
 */
function getUsernameFromRelativeLink(link: string): string | null {
    let match = /\/user\/([-~a-z0-9]+)\/?/g.exec(link)
    if (match == null) return null
    return match[1]
}

/**
 * Extracts a username from an HTMLElement's 'href' attribute
 * @param element The element
 */
function getUsernameFromHref(element: HTMLElement | null | undefined): string | null {
    let href = element?.getAttribute('href')
    if (href == null) return null
    return getUsernameFromRelativeLink(href)
}

/**
 * @returns The currently logged in user's username or null.
 */
function getUsername(): string | null {
    let username = getUsernameFromHref($(`a[href^="/user/"]`).get(0))
    if (username != null) console.log(`Setting user: '${username}'`)
    return username
}

// Input element getters
/// curiously enough, these work no matter which template is used
const categoryDropdown = $(`select[name="cat"]`).get(0) as HTMLSelectElement
const themeDropdown = $(`select[name="atype"]`).get(0) as HTMLSelectElement
const speciesDropdown = $(`select[name="species"]`).get(0) as HTMLSelectElement
const genderDropdown = $(`select[name="gender"]`).get(0) as HTMLSelectElement
var getRatingRadioButton = (rating: number) => $(`input[name="rating"][value="${rating}"]`).get(0) as HTMLInputElement
const ratingRadioButtons = ($(`input[name="rating"]`) as JQuery<HTMLInputElement>)
const disableCommentsCheckbox = $(`input[name="lock_comments"]`).get(0) as HTMLInputElement
const putInScrapsCheckbox = $(`input[name="scrap"]`).get(0) as HTMLInputElement
const folderCheckboxes = ($(`input[name="folder_ids[]"]`) as JQuery<HTMLInputElement>)
const titleInput = $(`input[name="title"]`).get(0) as HTMLInputElement
const descriptionTextArea = $(`textarea[name="message"]`).get(0) as HTMLTextAreaElement
const keywordsTextArea = $(`textarea[name="keywords"]`).get(0) as HTMLTextAreaElement
const keywordCount = $(`.keywords span`).get(0) as HTMLSpanElement

/** Set defaults */
function setDefaults() {
    // Set the default selections for the dropdown boxes
    Promise.resolve(GM_getValue(`${ACTIVE_USER}.defaultCategory`, 0)).then((defaultCategory: number) => {
        console.log(`defaultCategory = ${defaultCategory}`)
        if (defaultCategory == 0) return
        categoryDropdown.selectedIndex = defaultCategory
    })

    Promise.resolve(GM_getValue(`${ACTIVE_USER}.defaultTheme`, 0)).then((defaultTheme: number) => {
        console.log(`defaultTheme = ${defaultTheme}`)
        if (defaultTheme == 0) return
        themeDropdown.selectedIndex = defaultTheme
    })

    Promise.resolve(GM_getValue(`${ACTIVE_USER}.defaultSpecies`, 0)).then((defaultSpecies: number) => {
        console.log(`defaultSpecies = ${defaultSpecies}`)
        if (defaultSpecies == 0) return
        speciesDropdown.selectedIndex = defaultSpecies
    })

    Promise.resolve(GM_getValue(`${ACTIVE_USER}.defaultGender`, 0)).then((defaultGender: number) => {
        console.log(`defaultGender = ${defaultGender}`)
        if (defaultGender == 0) return
        genderDropdown.selectedIndex = defaultGender
    })

    // Set the default rating
    Promise.resolve(GM_getValue(`${ACTIVE_USER}.defaultRating`, -1)).then((defaultRating: number) => {
        console.log(`defaultRating = ${defaultRating}`)
        if (defaultRating == -1) return
        getRatingRadioButton(defaultRating).checked = true
    })

    // Set whether 'Disable Comments' is checked by default
    Promise.resolve(GM_getValue(`${ACTIVE_USER}.defaultDisableComments`, false)).then((defaultDisableComments: boolean) => {
        console.log(`defaultDisableComments = ${defaultDisableComments}`)
        if (!defaultDisableComments) return
        disableCommentsCheckbox.checked = true
    })

    // Set whether 'Put in Scraps' is checked by default
    Promise.resolve(GM_getValue(`${ACTIVE_USER}.defaultPutInScraps`, false)).then((defaultPutInScraps: boolean) => {
        console.log(`defaultPutInScraps = ${defaultPutInScraps}`)
        if (!defaultPutInScraps) return
        putInScrapsCheckbox.checked = true
    })

    // Set the default folders to put it in
    Promise.resolve(GM_getValue(`${ACTIVE_USER}.defaultFolders`, "")).then((defaultFolders: string) => {
        console.log(`defaultFolders = ${defaultFolders}`)
        if (!defaultFolders) return
        const folders = defaultFolders.split(',');
        folderCheckboxes.each(function() {
            if (folders.includes(this.value)) {
                this.checked = true
            }
        })
    })

    // Set the default title
    Promise.resolve(GM_getValue(`${ACTIVE_USER}.defaultTitle`, "")).then((defaultTitle: string) => {
        console.log(`defaultTitle = ${defaultTitle}`)
        if (!defaultTitle) return
        titleInput.defaultValue = defaultTitle
    })

    // Set the default description
    Promise.resolve(GM_getValue(`${ACTIVE_USER}.defaultDescription`, "")).then((defaultDescription: string) => {
        console.log(`defaultDescription = ${defaultDescription}`)
        if (!defaultDescription) return
        descriptionTextArea.defaultValue = defaultDescription
    })

    // Set the default keywords
    Promise.resolve(GM_getValue(`${ACTIVE_USER}.defaultKeywords`, "")).then((defaultKeywords: string) => {
        console.log(`defaultKeywords = ${defaultKeywords}`)
        if (!defaultKeywords) return
        keywordsTextArea.defaultValue = defaultKeywords
        keywordCount.innerText = `${parseInt(keywordCount.innerText, 10) - defaultKeywords.length}`
    })
}

function createDefaultButtons(set_callback: (this: GlobalEventHandlers, event: MouseEvent) => any, ...names: string[]) {
    const setDefaultButton = createSetDefaultButton(set_callback)
    const removeDefaultButton = createRemoveDefaultButton(...names)
    removeDefaultButton.onclick = function(event: MouseEvent) {
        for (let name of names) {
            GM_deleteValue(`${ACTIVE_USER}.default${name}`)
        }
        setDefaultButton.innerText = "Default unset!"
        setTimeout(() => setDefaultButton.innerText = "Set as default", 3000)
    }
    return [setDefaultButton, removeDefaultButton]
}

function createSetDefaultButton(callback: (this: GlobalEventHandlers, event: MouseEvent) => any) {
    const btn = document.createElement('button')
    btn.innerText = "Set as default"
    btn.type = 'button'
    btn.style.setProperty('font-size', '10px', 'important')
    btn.style.padding = '0px 13px 2px 12px'
    if (!isClassic) btn.style.marginLeft = '1em'
    btn.style.lineHeight = '1em'
    btn.className = 'button'
    btn.onclick = function(event: MouseEvent) {
        btn.innerText = "Default set!"
        setTimeout(() => btn.innerText = "Set as default", 3000)
        return callback.call(this, event)
    }
    return btn
}

function createRemoveDefaultButton(...names: string[]) {
    const btn = document.createElement('button')
    btn.innerText = "🗑"
    btn.type = 'button'
    btn.style.setProperty('font-size', '10px', 'important')
    btn.style.padding = '0px 0px 2px 0px'
    btn.style.marginLeft = '3px'
    btn.style.lineHeight = '1em'
    btn.className = 'button'
    btn.title = `Remove Default ${names.join(', ')}`
    btn.onclick = function(event: MouseEvent) {
        for (let name of names) {
            GM_deleteValue(`${ACTIVE_USER}.default${name}`)
        }
    }
    return btn
}

function createSetDefaultFunction(dropdown: HTMLSelectElement, name: string) {
    function setDefault() {
        GM_setValue(`${ACTIVE_USER}.default${name}`, dropdown.selectedIndex)
        console.log(`Set default ${name} to ${dropdown.options[dropdown.selectedIndex].textContent}`)
    }
    setDefault.name = `setDefault${name}`
    return setDefault
}

var setDefaultCategory = createSetDefaultFunction(categoryDropdown, "Category")
var setDefaultTheme = createSetDefaultFunction(themeDropdown, "Theme")
var setDefaultSpecies = createSetDefaultFunction(speciesDropdown, "Species")
var setDefaultGender = createSetDefaultFunction(genderDropdown, "Gender")
var setDefaultRating = () => ratingRadioButtons.each(function() {
    if (this.checked) {
        GM_setValue(`${ACTIVE_USER}.defaultRating`, this.valueAsNumber)
        console.log(`Set default Rating to ${this.nextElementSibling?.textContent}`)
    }
})
function setDefaultTitle() {
    GM_setValue(`${ACTIVE_USER}.defaultTitle`, titleInput.value)
    console.log(`Set default Title to ${titleInput.value}`)
}
function setDefaultDescription() {
    GM_setValue(`${ACTIVE_USER}.defaultDescription`, descriptionTextArea.value)
    console.log(`Set default Description to ${descriptionTextArea.value}`)
}
function setDefaultKeywords() {
    GM_setValue(`${ACTIVE_USER}.defaultKeywords`, keywordsTextArea.value)
    console.log(`Set default Keywords to ${keywordsTextArea.value}`)
}
function setDefaultDisableComments() {
    GM_setValue(`${ACTIVE_USER}.defaultDisableComments`, disableCommentsCheckbox.checked)
    console.log(`Set default DisableComments to ${disableCommentsCheckbox.checked}`)
}
function setDefaultPutInScraps() {
    GM_setValue(`${ACTIVE_USER}.defaultPutInScraps`, putInScrapsCheckbox.checked)
    console.log(`Set default PutInScraps to ${putInScrapsCheckbox.checked}`)
}
var setDefaultFolders = () => {
    let folderIds: string[] = []
    let folderNames: string[] = []
    folderCheckboxes.each(function() {
        if (this.checked) {
            folderIds.push(this.value)
            folderNames.push(this.nextElementSibling?.textContent ?? "<error>")
        }
    })
    GM_setValue(`${ACTIVE_USER}.defaultFolders`, folderIds.join(','))
    console.log(`Set default Folders to ${folderNames.join(', ')}`)
}

// Main Procedures
/** Main procedure for the Modern theme */
function main_modernTheme() {
    console.log("Theme detected: Modern")
    setDefaults()

    /*** Add buttons to save and remove defaults ***/
    $(`h4`).each(function() {
        switch (this.innerText) {
        case "Category":
            this.append(...createDefaultButtons(setDefaultCategory, 'Category'))
            break
        case "Theme":
            this.append(...createDefaultButtons(setDefaultTheme, 'Theme'))
            break
        case "Species":
            this.append(...createDefaultButtons(setDefaultSpecies, 'Species'))
            break
        case "Gender":
            this.append(...createDefaultButtons(setDefaultGender, 'Gender'))
            break
        case "Submission Rating":
            this.append(...createDefaultButtons(setDefaultRating, 'Rating'))
            break
        case "Title":
            this.append(...createDefaultButtons(setDefaultTitle, 'Title'))
            break
        case "Submission Description":
            this.append(...createDefaultButtons(setDefaultDescription, 'Description'))
            break
        }
    })

    const [keywordsBtn, delKeywordsBtn] = createDefaultButtons(setDefaultKeywords, 'Keywords')
    keywordsTextArea.before(keywordsBtn)
    keywordsBtn.after(delKeywordsBtn)

    $('.section-header > h2').each(function() {
        switch (this.innerText) {
        case "Submission Options":
            this.append(...createDefaultButtons(() => {
                setDefaultDisableComments()
                setDefaultPutInScraps()
            }, 'DisableComments', 'PutInScraps'))
            break
        case "Assign to Folders":
            this.append(...createDefaultButtons(setDefaultFolders, 'Folders'))
            break
        }
    })
}

/** Main procedure for the Classic theme */
function main_classicTheme() {
    console.log("Theme detected: Classic")
    setDefaults()

    /*** Add buttons to save and remove defaults ***/
    titleInput.after(
        document.createElement('br'),
        ...createDefaultButtons(setDefaultTitle, 'Title')
    )

    descriptionTextArea.after(
        document.createElement('br'),
        ...createDefaultButtons(setDefaultDescription, 'Description')
    )

    disableCommentsCheckbox.parentElement!.after(
        document.createElement('br'),
        ...createDefaultButtons(setDefaultDisableComments, 'DisableComments')
    )

    const div = document.createElement('div')
    div.append(...createDefaultButtons(setDefaultKeywords, 'Keywords'))
    div.style.display = 'inline-block'
    div.style.float = 'left'
    keywordCount.insertAdjacentElement('afterbegin', div);
    keywordCount.after(document.createElement('br'))

    categoryDropdown.after(
        document.createElement('br'),
        ...createDefaultButtons(setDefaultCategory, 'Category')
    )

    putInScrapsCheckbox.after(
        document.createElement('br'),
        ...createDefaultButtons(setDefaultPutInScraps, 'PutInScraps')
    )

    themeDropdown.after(
        document.createElement('br'),
        ...createDefaultButtons(setDefaultTheme, 'Theme')
    )

    speciesDropdown.after(
        document.createElement('br'),
        ...createDefaultButtons(setDefaultSpecies, 'Species')
    )

    genderDropdown.after(
        document.createElement('br'),
        ...createDefaultButtons(setDefaultGender, 'Gender')
    )

    getRatingRadioButton(1).parentElement!.querySelector(`#MAImage`)!.previousElementSibling!.previousElementSibling!.before(
        document.createElement('br'),
        ...createDefaultButtons(setDefaultRating, 'Rating')
    )

    $(`.pseudo_header`).each(function() {
        if (this.innerText == "Assign the submission to existing folders (optional)") {
            const [btn, btn2] = createDefaultButtons(setDefaultFolders, 'Folders')
            btn.style.marginLeft = '1em'
            this.append(btn, btn2)
        }
    })
}

const ACTIVE_USER = getUsername()
if (ACTIVE_USER) { // no point in running if there's no user logged in
    if (isClassic) {
        main_classicTheme()
    } else {
        main_modernTheme()
    }
    // actually wait how would someone get to this page if they weren't logged in???
}