(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
class AbstractModel {
    /**
     * Create a new abstract model.  If delegate is provided then all listener
     * adds and notifies are performed on the delegate listener collection.
     * @param {type} delegate
     * @returns {nm$_AbstractModel.AbstractModel}
     */
    constructor() {
        this.delegate = this;
        this.abstractModelListeners = [];        
    }

    getDelegate(){
        return this.delegate;
    }
    
    setDelegate(delegate = null){
        if (delegate === null) {
            this.delegate = this;
            this.abstractModelListeners = [];
        } else {
            this.delegate = delegate.delegate;
        }
        
        if (this.delegate === undefined){
            throw new Error("undefined delegate");
        }
    }
    
    addListener(listener) {
        if (typeof listener !== "object"){
            throw new Error("invalid AbstractModel listener type: " + typeof listener);
        }
        this.delegate.abstractModelListeners.push(listener);
    }

    /**
     * Call as notifyListeners(methodName, [methodArgument0, ... methodArgumentN])
     * @param {type} method
     * @returns {undefined}
     */
    async notifyListeners(method) {
        console.log("EVENT " + this.delegate.constructor.name + " " + method);

        Array.prototype.shift.apply(arguments);
        let event = {
            method: method,
            args: arguments,
            source: this,
            listeners: []
        };
        
        window.lastEvent = event;
        window.nEvents.push(window.lastEvent);

        for (let listener of this.delegate.abstractModelListeners) {
            if (listener[method]){
                console.log(" + " + listener.constructor.name + " " + method);
                window.lastEvent.listeners.push(listener.constructor.name);       
                await listener[method].apply(listener, arguments);
            }
            if (listener[AbstractModel.defaultListener]){
                console.log(" + " + listener.constructor.name + " " + AbstractModel.defaultListener);
                window.lastEvent.listeners.push(listener.constructor.name);       
                await listener[AbstractModel.defaultListener].apply(listener, window.lastEvent);                
            }
        }
    }
}

AbstractModel.defaultListener = "nidgetListener";
window.nEvents = [];
module.exports = AbstractModel;
},{}],2:[function(require,module,exports){
'use strict';
/**
 * Singleton class to providing functionality to DragNidgets and DropNidgets.
 * It stores the Nidget currently being dragged.
 */
class DragHandler{
    
    constructor(){
        this.current = null;
        this.over = [];
    }
    
    pushOver(nidget){
        if (this.overHas(nidget)) return false;
        this.over.push(nidget);
        return true;
    }
    
    removeOver(nidget){
        if (!this.overHas(nidget)) return false;
        this.over.splice(this.over.indexOf(nidget), 1);
        return true;
    }    
    
    overHas(nidget){
        return this.over.indexOf(nidget) !== -1;
    }
    
    set(nidget){
        this.current = nidget;
    }
    
    get(){
        return this.current;
    }
    
    has(){
        return this.current !== null;
    }
    
    clear(){
        this.current = null;
    }
    
    static getInstance(){
        return DragHandler.instance;
    }    
}

module.exports = new DragHandler();


},{}],3:[function(require,module,exports){
'use strict';
const NidgetElement = require("./NidgetElement");

/* global Utility */
class FileOperations {
    /**
     * Create a new dom element from a file (url).  Map variables (${...}) to 
     * a value.
     * @param {type} url
     * @param {type} map
     * @returns {node|FileOperations.loadDOMElement.domElement}
     */
    static async loadNidget(url, map){        
        let element = await FileOperations.loadDOMElement(url, map);
        return new NidgetElement(element);
    }    
    
    /**
     * Create a new dom element from a file (url).  Map variables (${...}) to 
     * a value.
     * @param {type} url
     * @param {type} map
     * @returns {node|FileOperations.loadDOMElement.domElement}
     */
    static async loadDOMElement(url, map = new Map()){        
        if (map instanceof Map === false) map = FileOperations.objectToMap(map);       
        let text = await FileOperations.getURL(url);
        return FileOperations.stringToDOMElement(text, map);
    }

    /**
     * Create a new dom element from text.
     * @param {type} text
     * @param {type} map
     * @returns {node|FileOperations.loadDOMElement.domElement}
     */
    static stringToDOMElement(text, map = new Map()){
        /* replace variables with values */
        for (let key of map.keys()){                  
            let value = map.get(key);
            let regex = new RegExp(`[$][{]?${key}[}]`, `g`);
            text = text.replace(regex, value);    
        }

        /* replace unfilled variables with empty */
        let regex = new RegExp(`[$][{][^}]*[}]`, `g`);
        text = text.replace(regex, ""); 

        let element = document.createElement('div');
        element.innerHTML = text;
        let domElement = null;
        console.log(element);

        return element;
    }

    static objectToMap(object){
        let map = new Map();
        for (let field in object){            
            if (typeof object[field] === "string" || typeof object[field] === "number"){
                map.set(field, object[field]);
            }
        }
        return map;
    }

    

    /*
     * Transfer contents of 'filename' from server to client.
     * @param {String} filename
     * @param {Function} successCallback
     * @param {Function} errorCallback
     * @returns {String} contents of file
     */
    static getURL(url) {
        let callback = function (resolve, reject) {
            var xhttp = new XMLHttpRequest();

            xhttp.onreadystatechange = function () {
                if (xhttp.readyState === 4) {
                    if (xhttp.status === 200) {
                        resolve(xhttp.responseText);
                    } else {
                        reject({
                            xhttp : xhttp,
                            status : xhttp.status, 
                            text : xhttp.responseText,
                            url : url
                        });
                    }
                }
            };
            
            xhttp.open("GET", url, true);
            xhttp.send(null);
        };

        return new Promise(callback);
    }

    /**
     * Create a new dom element from text.
     * @param {type} text
     * @param {type} map
     * @returns {node|FileOperations.loadDOMElement.domElement}
     */
    static async getFile(url, map = new Map()){
        let text = await FileOperations.getURL(url);

        /* replace variables with values */
        for (let key of map.keys()){
            let value = map.get(key);
            let regex = new RegExp(`[$][{]?${key}[}]`, `g`);
            text = text.replace(regex, value);
        }

        /* replace unfilled variables with empty */
        let regex = new RegExp(`[$][{][^}]*[}]`, `g`);
        text = text.replace(regex, "");

        return text;
    }

    /*
     * Transfer contents of 'filename' from server to client using current window location.
     * @param {String} filename
     * @param {Function} successCallback
     * @param {Function} errorCallback
     * @returns {undefined}
     */
    static getLocal(filename) {
        let callback = function (resolve, reject) {
            var xhttp = new XMLHttpRequest();
            var data = {};
            var url = window.location.href + "/" + filename;

            xhttp.onreadystatechange = function () {
                if (xhttp.readyState === 4) {
                    if (xhttp.status === 200) {
                        resolve(xhttp.responseText);
                    } else {
                        reject(xhttp.status, xhttp.responseText);
                    }
                }
            };

            xhttp.open("GET", url, true);
            xhttp.send(JSON.stringify(data));
        };

        return new Promise(callback);
    }
    
    /**
     * Cause 'text' to be saved as 'filename' client side.
     * @param {type} filename The default filename to save the text as.
     * @param {type} text The text to save to filename.
     * @returns {undefined}
     */
    static saveToFile(text, filename) {
        let anchor = document.createElement('a');
        let data = "text;charset=utf-8," + encodeURIComponent(text);
        anchor.setAttribute("href", "data:" + data);
        anchor.setAttribute("download", filename);
        anchor.click();
    }
}

FileOperations.NodeType = {
    ELEMENT : 1,
    ATTRIBUTE : 2,
    TEXT : 3, 
    CDATASECTION : 4,
    ENTITYREFERNCE : 5,
    ENTITY : 6,
    PROCESSINGINSTRUCTION : 7,
    COMMENT : 8,
    DOCUMENT : 9,
    DOCUMENTTYPE : 10,
    DOCUMENTFRAGMENT : 11,
    NOTATION : 12
};

module.exports = FileOperations;
},{"./NidgetElement":7}],4:[function(require,module,exports){
'use strict';
module.exports = {
    mouse : require("./nidget-interfaces/Mouse"), 
    drag : require("./nidget-interfaces/Drag"),
    drop : require("./nidget-interfaces/Drop"),
    movable : require("./nidget-interfaces/Movable"),
    resize : require("./nidget-interfaces/Resize")
};
},{"./nidget-interfaces/Drag":17,"./nidget-interfaces/Drop":18,"./nidget-interfaces/Mouse":19,"./nidget-interfaces/Movable":20,"./nidget-interfaces/Resize":21}],5:[function(require,module,exports){
"use strict";

/**
 * Singlton class to add functionality to the mouse.
 */
class MouseUtilities {
    
    constructor(){
        this.attachedElement = null;
        this.lastX = 0;
        this.lastY = 0;
    }
    
    isUnder(event, element) {
        let x = event.clientX;
        let y = event.clientY;
        let current = document.elementFromPoint(x, y);

        while (current) {
            if (current === element) return true;
            current = current.parentElement;
        }
        return false;
    }

    getUnder(event) {
        let x = event.clientX;
        let y = event.clientY;
        return document.elementFromPoint(x, y);
    }

    set element(element){
        if (this.attachedElement !== null){
            this.detachElement();
        }
        if (!element || element === null || element === undefined){
            this.detachElement();
        } else {
            this.attachElement(element);
        }
    }
    
    get element(){
        return this.attachedElement;
    }

    /**
     * Attach an element.  If the element doesn't have a parent it will be
     * attached to the document and will be detached when detachElement is called.
     * @param {type} element
     * @returns {undefined}
     */
    attachElement(element) {
        this.attachedElement = element;
        
        if (element.parent){
            throw new Error("Can not attach element to mouse if the element has a parent element.");
        }
                
        document.body.append(element);
        element.style.position = "absolute"; 
        element.style.top = event.clientY + "px";
        element.style.left = event.clientX + "px";
        element.style.pointerEvents = "none";
        element.style.zIndex = "10000";
        
        this.moveCallBack = (event)=>this.onMouseMove(event);
        window.addEventListener("mousemove", this.moveCallBack);
    }

    /**
     * Remove listeners from the attached element, do not remove it from the
     * document.
     * @returns {type}
     */
    detachElement(){
        if (this.attachedElement === null) return;
        
        window.removeEventListener("mousemove", this.moveCallBack);        
        let rvalue = this.attachedElement;
        this.attachedElement = null;        
        document.body.removeChild(rvalue);
        
        return rvalue;
    }

    onMouseMove(event) {        
        event.preventDefault();
        this.lastX = event.clientX;
        this.lastY = event.clientY;

        // set the element's new position:
        this.attachedElement.style.top = event.clientY + "px";
        this.attachedElement.style.left = event.clientX + "px";
    }
}

module.exports = new MouseUtilities();
},{}],6:[function(require,module,exports){
'use strict';

module.exports = {
    prefix: "data-nidget",
    elementAttribute: "data-nidget-element",
    srcAttribute: "src",
    templateSrcAttribute: "template-src",
    nameAttribute: "name",
    interfaceAttribute: "interfaces",
    templateAttribute: "template-id",
    interfaceDataField: "interfaceData",
    modelDataField: "modelData",
    styleAttribute: "nidget-style"
};
},{}],7:[function(require,module,exports){
"use strict";
const FileOperations = require("./FileOperations");
const Nidget = require("./Nidget");
const Interfaces = require("./Interfaces");
const Transformer = require("./Transformer");
const NidgetStyle = require("./NidgetStyle");

/**
 * Calculate the w:h aspect ratio and adjust the proportions accordingly.
 *
 */
class AspectRatio{
    constructor(nidget) {
        this.nidget = nidget;
        this.observer = new ResizeObserver(()=>this.onResize());
        this.observer.observe(this.nidget);
        this.parseValues();
        this.onResize();
        this.loaded = false;
    }

    getValue(){
        return getComputedStyle(this.nidget).getPropertyValue(AspectRatio.CSS_ATTRIBUTE);
    }

    parseValues(){
        let value = this.getValue();
        let split = value.split(/[ ,;]/g);

        for (let s of split){
            if (s.split(/[-:]/).length === 2){
                let ratio = s.split(/[-:]/);
                this.width = parseInt(ratio[0]);
                this.height = parseInt(ratio[1]);
            }
            else if (s === "h"){
                this.onResize = ()=> {
                    let height = this.nidget.getBoundingClientRect().height;
                    this.nidget.style.width = (height * this.width / this.height) + "px"
                }
            }
        }
    }

    onResize(){
        let width = this.nidget.getBoundingClientRect().width;
        this.nidget.style.height = (width * this.height / this.width) + "px";
    }
}

AspectRatio.CSS_ATTRIBUTE = "--nidget-aspect-ratio";

/**
 * A NidgetElement is a 1:1 class-object:dom-object pairing.  Actions on the DOM 
 * object should only be called by the NidgetElement object.  The interfaceData
 * field is reserved for data from interfaces.  Interfaces should put their 
 * custom data under [interfaceDataField].[interfaceName].  The interface data
 * attribute is set with the static value Nidget.interfaceDataField.
 * 
 * Calling methods on the nidget will treat shadow contents as regular contents.
 */
class NidgetElement extends HTMLElement {
    /**
     * Create a new Nidget associated with 'element'.  An error will be thrown
     * if the 'element' is already associated with a Nidget.
     * 
     * Disabled class indicates this nidget will ignore mouse events.
     * 
     * @param {type} element JQuery selector
     * @return {nm$_Nidget.NidgetElement}
     */
    constructor(templateId) {
        super();
        this[Nidget.interfaceDataField] = {};
        this[Nidget.modelDataField] = {};
        this.transformer = new Transformer(this);
        this.observers = {};

        if (templateId){
            this.applyTemplate(templateId);
        }
    }

    /**
        connectedCallback is invoked each time the custom element is appended into a document-connected element
     */
    async connectedCallback() {
        this.shadowContents = this;

        if (this.hasAttribute(Nidget.templateAttribute)){
            await this.applyTemplate(this.getAttribute(Nidget.templateAttribute));
        }

        this.notifyStyles();
    }

    /**
     * Retrieve a map of all data attributes
     * @returns {Map<any, any>}
     */
    dataAttributes() {
        let map = new Map();
        for (let attr of this.attributes) {
            if (attr.name.startsWith("data-")) {
                let name = attr.name.substr(5);
                map[name] = attr.value;
            }
        }
        return map;
    }

    notifyStyles(){
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                let ar = getComputedStyle(this).getPropertyValue(AspectRatio.CSS_ATTRIBUTE);
                if (ar !== "") new AspectRatio(this);
                resolve();
            }, 100);
        });
    }

    /**
     * Attach a shadow element with the contents of the template named (templateID).
     * @return {undefined}
     */
    async applyTemplate(templateId) {
        if (this.shadowRoot !== null) return;
        let template = document.getElementById(templateId);

        if (!template) throw new Error("Template '" + templateId + "' not found.");
        if (template.tagName.toUpperCase() !== "TEMPLATE") throw new Error("Element with id '" + templateId + "' is not a template.");

        this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true));
        await this.ready();
    }

    async ready(){

    }

    /**
     * Load contents of file into this element.
     * Replace all ${} variables with contents of 'map'.
     */
    async retrieveSource(map){
        let src = this.getAttribute(Nidget.srcAttribute);
        let text = await FileOperations.getFile(src, map);
        this.innerHTML = text;
    }

    static async loadTemplateSnippet(filename, tagname){
        let id = filename.replace(/[\// .-]+/g, "_");

        if (!document.querySelector(`#${id}`)){
            let text = await FileOperations.getFile(filename);
            let template = document.createElement("template");
            template.innerHTML = text;
            template.setAttribute("id", id);
            if (tagname) template.setAttribute("data-nidget", tagname);
            document.body.append(template);
        }

        let template = document.querySelector(`#${id}`);

        for (let ele of document.querySelectorAll(tagname)){
            await ele.injectTemplate(template);
        }
    }

    /**
     * Remove 'hidden' class.
     */
    show() {
        this.classList.remove("hidden");
    }

    /**
     * Add 'hidden' class.
     */
    hide() {
        this.classList.add("hidden");
    }

    /**
     * Set the disabled flag that is read by nidget mouse functions.
     * @param value
     */
    set disabled(value){
        if (value === true) {
            this.setAttribute(NidgetElement.DISABLED_ATTRIBUTE, true);
        } else {
            this.removeAttribute(NidgetElement.DISABLED_ATTRIBUTE, false);
        }
    }

    /**
     * Get the disabled flag that is read by nidget mouse functions.
     * @param value
     */
    get disabled(){
        if (!this.hasAttribute(NidgetElement.DISABLED_ATTRIBUTE)) return false;
        return this.getAttribute(NidgetElement.DISABLED_ATTRIBUTE);
    }

    /**
     * Return true if this element was under the mouse for the event.
     * @param {type} event
     * @param {type} element
     * @return {Boolean}
     */
    isUnderMouse(event) {
        let x = event.clientX;
        let y = event.clientY;
        let current = document.elementFromPoint(x, y);

        while (current) {
            if (current === this) return true;
            current = current.parentElement;
        }
        return false;
    }

    /**
     * Run the query selector on this element.
     * If this element has a shadow, run it on that instead.
     * @param selectors
     * @returns {HTMLElementTagNameMap[K]}
     */
   querySelector(selectors) {
        if (this.shadowRoot){
            return this.shadowRoot.querySelector(selectors);
        } else {
            return super.querySelector(selectors);
        }
    }

    /**
     * Run the query selector on this element.
     * If this element has a shadow, run it on that instead.
     * @param selectors
     * @returns {HTMLElementTagNameMap[K]}
     */
    querySelectorAll(selectors) {
        if (this.shadowRoot){
            return this.shadowRoot.querySelectorAll(selectors);
        } else {
            return super.querySelectorAll(selectors);
        }
    }

    /**
     * Remove this element from it's parent.
     */
    detach(){
        this.parentNode.removeChild(this);
    }

    /**
     * Index within the parent element.
     */
    index(){
        return Array.from(this.parentElement.children).indexOf(this);
    }
}

NidgetElement.DISABLED_ATTRIBUTE = "nidget-disabled";
window.customElements.define('nidget-element', NidgetElement);
module.exports = NidgetElement;
},{"./FileOperations":3,"./Interfaces":4,"./Nidget":6,"./NidgetStyle":8,"./Transformer":9}],8:[function(require,module,exports){
'use strict';
/**
 * Manipulates the elements style with js routines according to css flags.
 * Nidget style is applied to all nidget-elements unless they have the nidget-style
 * attribute set to 'false'.
 */

class NidgetStyle {

    constructor(nidget) {
        this.nidget = nidget;
        this.apply();
    }
    
    apply() {
        this.nidgetWidthRatio();
        this.nidgetHeightRatio();
        this.nidgetFitText();
        this.nidgetFitTextWidth();
        this.nidgetVertAlignText();
    }
    
    nidgetWidthRatio() {
        let ratio = getComputedStyle(this.nidget).getPropertyValue("--nidget-width-ratio");
        if (!parseFloat(ratio)) return;                
        
        new ResizeObserver(() => {            
            this.nidget.width = this.nidget.height * ratio;
        }).observe(this.nidget);      
    }
    
    nidgetHeightRatio() {
        let ratio = getComputedStyle(this.nidget).getPropertyValue("--nidget-height-ratio");
        if (!parseFloat(ratio)) return;                
        
        new ResizeObserver(() => {                        
            this.nidget.height = this.nidget.width * ratio;
        }).observe(this.nidget);      
    }

    /**
     * Fill the text height to match the element height.
     * Change the ratio value (or the fontSize) adjust.
     */
    nidgetFitText() {
        let ratio = getComputedStyle(this.nidget).getPropertyValue("--nidget-fit-text");        
        if (!parseFloat(ratio)) return;

        new ResizeObserver(() => {
            console.log(`--nidget-fit-text ${ratio}`)
            let h = this.nidget.offsetHeight * ratio;
            this.nidget.style.fontSize = h + "px";
        }).observe(this.nidget);      
    }

    /**
     *  Will change the font size so that the text fit's in the parent element.
     *  Don't set the width of the element.
     */
    nidgetFitTextWidth() {
        let remove = getComputedStyle(this.nidget).getPropertyValue("--nidget-fit-text-width");
        if (!parseFloat(remove)) return;

        new ResizeObserver(() => {
            this.nidget.parentElement

            let textW = this.nidget.scrollWidth;
            let contW = this.nidget.parentElement.offsetWidth;
            contW = contW - remove;
            let dw = contW/textW;
            let computedFontSize = window.getComputedStyle(this.nidget, null).getPropertyValue('font-size')
            computedFontSize = parseInt(computedFontSize);
            computedFontSize = Math.round(computedFontSize);
            let newFontSize = Math.round(computedFontSize * dw);
            let h = this.nidget.offsetHeight

            if (Math.abs(computedFontSize - newFontSize) <= 2) return;

            if (newFontSize > h) newFontSize = h;

            this.nidget.style.fontSize = newFontSize + "px";
        }).observe(this.nidget);
    }

    /**
     * Set the line height to the offset height multiplied by ratio.
     */
    nidgetVertAlignText(){
        let ratio = getComputedStyle(this.nidget).getPropertyValue("--nidget-vert-align-text");
        if (!parseFloat(ratio)) return;

        new ResizeObserver(() => {
            let h = this.nidget.offsetHeight * ratio;
            this.nidget.style.lineHeight = h + "px";
        }).observe(this.nidget);
    }
}

module.exports = NidgetStyle;
},{}],9:[function(require,module,exports){
'use strict';
class Transform{
    constructor(value){
        let indexOf = value.indexOf("(");
        this.name = value.substring(0, indexOf);
        this.value = value.substring(this.name.length + 1, value.length - 1);
        console.log(this.name + ", " + this.value);
    }
    
    toString(){
        return this.name + "(" + this.value + ")";
    }    
}

class Transformer {

    constructor(element) {
        this.element = element;
    }
    
    append(){
        let computedStyle = window.getComputedStyle(this.element)["transform"];
        if (computedStyle !== "none") this.push(computedStyle);
        return this;
    }
    
    clear(){
        this.element.style.transform = "";
        return this;
    }
    
    unshift(value){
        this.element.style.transform = value + " " + this.element.style.transform;
    }
    
    push(value){
        this.element.style.transform = this.element.style.transform + " " + value;
        return this;
    }    
    
    shift(){
        let array = this.split();
        if (array.length === 0) return "";
        array.shift();
        this.element.style.transform = array.join(" ");
        return this;
    }
    
    pop(){
        let array = this.split();
        if (array.length === 0) return "";
        array.pop();
        this.element.style.transform = array.join(" ");
        return this;      
    }
    
    replace(value){
        let newTransform = new Transform(value);
        let array = this.split();
        
        for (let i = 0; i < array.length; i++){
            let entry = array[i];
            let transform = new Transform(entry);
            if (transform.name === newTransform.name){
                array[i] = newTransform.toString();
                this.element.style.transform = array.join(" ");
                return this;
            }
        }
        return this;
    }
    
    split(){
        let value = this.element.style.transform;
        let start = 0;
        let rvalue = [];
        let last = '';
        let skip = false;
        let nestedP = 0;
        
        for (let i = 0; i < value.length; i++){
            if (!skip && value[i] === ' ' && last === ' '){
                start = i + 1;
            }
            else if (!skip && value[i] === ' ') {
                rvalue.push(value.substring(start, i));
                start = i;
            } else if (value[i] === '(') {
                nestedP++;
                skip = true;
            } else if (value[i] === ')') {
                nestedP--;
                if (nestedP === 0) skip = false;
            }
            last = value[i];
        }
        rvalue.push(value.substring(start, value.length));
        return rvalue;
    }
    
    toString(){
        return this.element.style.transform;
    }
}

module.exports = Transformer;
},{}],10:[function(require,module,exports){
"use strict";
const NidgetElement = require("../NidgetElement");

/**
 * A Nidget that changes the image for hover, disabled, press, and idle.
 * Fires a click event when clicked.
 *
 * Will set the current state as data-state so that css can access it.
 */
class NidgetButton extends NidgetElement {

    connectedCallback() {
        super.connectedCallback();
        this.alphaTolerance = 0; // alpha needs to be > tolerance to trigger events.

        this.stringHover = "nidget-button-state[state='HOVER']";
        this.stringDisabled = "nidget-button-state[state='DISABLED']";
        this.stringPress = "nidget-button-state[state='PRESS']";
        this.stringIdle = "nidget-button-state[state='IDLE']";

        this.state = "idle";
    }

    isInSet() {
        let parent = this.parentNode;
        while (parent != null) {
            if (parent.tagName === "NIDGET-BUTTON-SET") {
                return true;
            }
            parent = parent.parentNode;
        }
        return false;
    }

    nidgetReady() {
        if (this.disabled) {
            this.activeNidget = this.stringDisabled;
        } else {
            this.activeNidget = this.stringIdle;
        }

        if (this.isInSet()) return;

        this.addEventListener("mouseenter", this.mouseEnter);
        this.addEventListener("mouseleave", this.mouseLeave);
        this.addEventListener("mousedown", this.mousePress);
        this.addEventListener("mouseup", this.mouseRelease);

        this.addEventListener("click", (e) => {
            if (!this.disabled) return true;
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        });

    }

    isUnder(event) {
        let elements = document.elementsFromPoint(event.clientX, event.clientY);
        if (elements.indexOf(this.activeNidget) == -1) return false;

        let rect = this.activeNidget.getBoundingClientRect();
        let x = event.clientX - rect.x;
        let y = event.clientY - rect.y;

        return this.testAlpha(x, y);
    }

    get disabled() {
        return super.disabled;
    }

    set disabled(value) {
        super.disabled = value;

        if (value === true) {
            this.activeNidget = this.stringDisabled;
        } else {
            switch (this.state) {
                case "in":
                    this.activeNidget = this.stringHover;
                    break;
                case "press":
                    this.activeNidget = this.stringPress;
                    break;
                default:
                    this.activeNidget = this.stringIdle;
                    break;
            }
        }
    }

    mouseRelease(e) {
        this.state = "hover";
        if (this.disabled) return;
        this.activeNidget = this.stringHover;
    }

    mousePress(e) {
        this.state = "press";
        if (this.disabled) return;
        this.activeNidget = this.stringPress;
    }

    hideAllImages() {
        this.querySelector(this.stringHover).hide();
        this.querySelector(this.stringDisabled).hide();
        this.querySelector(this.stringPress).hide();
        this.querySelector(this.stringIdle).hide();
    }

    set activeNidget(selector) {
        this.hideAllImages();
        this._activeNidget = this.querySelector(selector);
        this._activeNidget.show();
    }

    get activeNidget() {
        return this._activeNidget;
    }

    set state(value) {
        this.setAttribute("data-state", value);
    }

    get state() {
        return this.getAttribute("data-state");
    }

    testAlpha(x, y) {
        let pixel = this.activeNidget.getPixel(x, y);
        return pixel[3] > this.alphaTolerance;
    }

    mouseLeave() {
        this.state = "out";
        if (this.disabled) return;
        this.activeNidget = this.stringIdle;
    }

    mouseActive() {
        this.state = "hover";
        if (this.disabled) return;
        this.activeNidget = this.stringHover;
    }

    mouseMove(e) {
        if (!this.testAlpha(e.clientX, e.clientY)) {
            this.state = "out";
            if (this.disabled) return;
            this.activeNidget = this.stringIdle;
        } else {
            this.state = "hover";
            if (this.disabled) return;
            this.activeNidget = this.stringHover;
        }
    }
}
;

window.customElements.define('nidget-button', NidgetButton);
module.exports = NidgetButton;


},{"../NidgetElement":7}],11:[function(require,module,exports){
"use strict";
const NidgetElement = require("../NidgetElement");

class NidgetButtonSet extends NidgetElement {
    connectedCallback() {
        super.connectedCallback();
        this.alphaTolerance = 0; // alpha needs to be > tolerance to trigger events.

        this.addEventListener("mousedown", this.mousePress);
        this.addEventListener("mouseup", this.mouseRelease);
        this.addEventListener("mousemove", this.mouseMove);
        this.addEventListener("mouseleave", this.mouseLeave);

        this.addEventListener("click", function (e) {
            if (!this.disabled) return true;
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        });
    }

    nidgetReady(){
        this.buttons = this.querySelectorAll("nidget-button");
    }

    mousePress(e){
        for (let element of this.buttons) {
            if (element.isUnder(e)) {
                element.mousePress();
                this.state = "press";
            }
        }
    }

    mouseRelease(e){
        this.state = "out";
        for (let element of this.buttons) {
            if (element.isUnder(e)) {
                if (element.state == "press"){
                    this.dispatchEvent(new CustomEvent("button-clicked", {detail: element}));
                }
                element.mouseRelease();
                this.state = "hover";
            }
        }
    }

    mouseMove(e){
        this.state = "out";
        for (let element of this.buttons){
            if (element.isUnder(e)) {
                element.mouseActive();
                this.state = "hover";
            } else {
                element.mouseLeave();
            }
        }
    }

    mouseLeave(e){
        for (let element of this.buttons) {
            element.mouseLeave();
            this.state = "out";
        }
    }

    set state(value){
        this.setAttribute("data-state", value);
    }

    get state(){
        return this.getAttribute("data-state");
    }
}

window.customElements.define('nidget-button-set', NidgetButtonSet);
module.exports = NidgetButtonSet;
},{"../NidgetElement":7}],12:[function(require,module,exports){
"use strict";
const Nidget = require("../NidgetElement");

/**
 * A Nidget that changes the image for hover, disabled, press, and idle.
 * Fires a click event when clicked.
 * 
 * This is the html element "nidget-button".
 * If the nidget-button has the attribute `img-prefix = "prefix"` then the 
 * following images.  `img-suffix` = "suffix" will override the ".png".
 * will be used:
 * - prefix-hover.png
 * - prefix-disabled.png
 * - prefix-press.png
 * - prefix-idle.png
 */
class NidgetButtonState extends Nidget {

    connectedCallback() {
        super.connectedCallback();
    }

    nidgetReady(){
        this.img = document.createElement("img");
        this.img.setAttribute("src", this.getAttribute("image-src"));
        this.append(this.img);
    }

    show(){
        super.show();
        this.loadCanvas();
    }

    loadCanvas(){
        if (!this.img || this.canvas) return;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.img.naturalWidth;
        this.canvas.height = this.img.naturalHeight;
        this.canvas.getContext('2d').drawImage(this.img, 0, 0);
        return this.canvas;
    }

    getPixel(x, y){
        this.loadCanvas();
        let dx = this.canvas.width / this.offsetWidth;
        let dy = this.canvas.height / this.offsetHeight;
        let pixel = this.canvas.getContext('2d').getImageData(dx * x, dy * y, 1, 1).data;
        return pixel;
    }

    /**
     * Set state to HOVER, DISABLED, PRESS, IDLE.
     * @param {type} state
     * @return {undefined}
     */
    set state(state) {
        this.setAttribute("state", state.toUpperCase());
    }

    get state() {
        return this.setAttribute("state");
    }

    set source(img) {
        this.setAttribute("src", img);
    }

    get source() {
        return this.setAttribute("src");
    }
}
;

window.customElements.define('nidget-button-state', NidgetButtonState);
module.exports = NidgetButtonState;


},{"../NidgetElement":7}],13:[function(require,module,exports){
"use strict";
const NidgetElement = require("../NidgetElement");

/**
 * A component that has events for adding nidgets, removing nidgets, and 
 * resizing the container.  When the container size is changed, the number
 * of components change, or the layout attribute changes, the doLayout function
 * is called.
 * 
 * The components are arraged according to the selected layout attribute.  If 
 * no layout attribute is chosen, doLayout is still called as it is assumed 
 * a custom function has been provided.
 */

class NidgetContainer extends NidgetElement {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        let resizeObserver = new ResizeObserver(this.doLayout);
        resizeObserver.observe(this);
    }

    static get observedAttributes() {
        return [NidgetContainer.layoutAttribute];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        this.doLayout();
    }

    set layout(value) {
        this.setAttribute(NidgetContainer.layoutAttribute, value);
    }

    get layout() {
        return this.getAttribute(NidgetContainer.layoutAttribute);
    }      

    doLayout() {
        if (!this.layout) return;
        if (!Layouts[this.layout]) throw `invalid layout: ${this.layout}`;
        Layouts[this.layout];
    }
}

class Layouts {
    /**
     * Fit all nidgets evenly in a horizontal row.
     * @param {type} nidget
     * @return {undefined}
     */
    static row(nidget) {
        console.log(this.size);
    }
}


NidgetContainer.layoutAttribute = "layout";
window.customElements.define('nidget-container', NidgetContainer);
module.exports = NidgetContainer;
},{"../NidgetElement":7}],14:[function(require,module,exports){
"use strict";
const Nidget = require("../Nidget");
const Transformer = require("../Transformer");

/**
 * Don't forget to set 'is' when putting element directly in html as opposed to
 * programically.
 * <img is="registered-name" src="image.png"></img>
 * 
 * include a custom element definition at the end of the class.<br>
 * window.customElements.define('registered-name', Class, {extends: "img"});
 */
class NidgetHTMLImage extends HTMLImageElement {
    constructor() {
        super();
        this.lastDisplay = undefined;
        this.transformer = new Transformer(this);
    }

    scale(dw, dh) {
        if (!dh) dh = dw;
        let w = this.width * dw;
        let h = this.height * dh;
        this.width = w;
        this.height = h;
    }        

    set src(value) {
        this.setAttribute("src", value);
    }

    get src() {
        return this.getAttribute("src");
    }

    locate(left, top) {
        this.left = left;
        this.top = top;
    }

    get left() {
        let w = window.getComputedStyle(this).left;
        return parseFloat(w);
    }

    get top() {
        let h = window.getComputedStyle(this).top;
        return parseFloat(h);
    }

    set left(value) {
        this.style.left = value + "px";
    }

    set top(value) {
        this.style.top = value + "px";
    }    

    set width(w) {
        this.style.width = w + "px";
    }

    set height(w) {
        this.style.height = w + "px";
    }

    get width() {
        let w = window.getComputedStyle(this).width;
        return parseFloat(w);
    }

    get height() {
        let h = window.getComputedStyle(this).height;
        return parseFloat(h);
    }        

    show() {
        if (this.lastDisplay) {
            this.style.display = this.lastDisplay;
            this.lastDisplay = undefined;
        } else {
            this.style.display = "inline-block";
        }
    }

    hide() {
        this.lastDisplay = this.style.display;
        this.style.display = "none";
    }

    set display(value){
        this.style.display = value;
    }
    
    get display(){
        return window.calculateStyle(this)["display"];
    }

    detach() {
        try {
            this.parentNode.removeChild(this);
        } catch (err) {
            console.error(this);
            console.error(err);
        }
    }
    
    set disabled(value){
        if (value === true) {
            this.setAttribute("disabled", true);
        } else {
            this.removeAttribute("disabled", false);
        }
    }
    
    get disabled(){
        if (!this.hasAttribute("disabled")) return false;
        return this.getAttribute("disabled");
    }    
    
    clearPos(){
        this.style.top = null;
        this.style.left = null;
    }

    clearDims(){
        this.style.width = null;
        this.style.height = null;
    }    
}

module.exports = NidgetHTMLImage;

},{"../Nidget":6,"../Transformer":9}],15:[function(require,module,exports){
"use strict";
const NidgetElement = require("../NidgetElement");

/**
 * A Nidget that contains images.
 */
class NidgetImage extends NidgetElement {

    constructor(src){
        super();
        this.img = document.createElement("img");
        if (src) this.src = src;
    }

    connectedCallback(){
        let src = this.getAttribute(NidgetImage.srcAttribute);        
        if (src) this.img.setAttribute("src", src);       
        this.appendChild(this.img);
        super.connectedCallback();
    }

    get src(){
        return this.img.getAttribute("src");
    }

    set src(value){
        this.img.setAttribute("src", value);
    }

    size(width, height){
        this.style.width = width
        this.style.height = height
        this.img.style.width = width
        this.img.style.height = height
    }
    
    scale(dw, dh){
        if (!dh) dh = dw;
        let width = this.offsetWidth * dw;
        let height = this.offsetHeight * dh;
        this.size(`${width}px`, `${height}px`);
    }
    
    show(){
        if (this.style.display === "none"){
            delete this.style.display;
        }
    }
    
    hide(){
        this.style.display = "none";
    }
}

NidgetImage.srcAttribute = "src";
window.customElements.define('nidget-image', NidgetImage);
module.exports = NidgetImage;
},{"../NidgetElement":7}],16:[function(require,module,exports){
"use strict";
const NidgetElement = require("../NidgetElement");

/**
 * When using --nidget-fit-text, do not include height and width attributes.
 * A font size can be used as a starting point.
 */
class FitText {
    constructor(nidget){
        this.nidget = nidget;
        this.lock = "none";
        this.parseArguments();
    }

    listen(){
        this.observer = new ResizeObserver(()=>this.delayResize(this.hValue, this.wValue));
        this.observer.observe(this.nidget.parentElement);
        this.direction = 0;
        this.delay = 25;
        this.delayResize(this.hValue, this.wValue);
        this.stop = false;
    }

    delayResize(hValue, wValue){
        this.direction = 0;
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(()=>this.onResize(hValue, wValue), this.delay);
    }

    notify(hValue, wValue){
        this.stop = false;
        this.delayResize(hValue, wValue);
    }

    parseArguments(){
        let args = getComputedStyle(this.nidget).getPropertyValue("--nidget-fit-text");

        if (!args || args === false || args === "false"){
            return;
        }

        this.hValue = this.wValue = true;

        if (typeof(args) == "string"){
            let obj = JSON.parse(args);
            if (obj["fit"] !== undefined && obj["fit"] === "width") this.hValue = false;
            if (obj["fit"] !== undefined && obj["fit"] === "height") this.wValue = false;
            if (obj["lock"] !== undefined) this.lock = (obj["lock"]);
        }
    }

    onResize(hValue, wValue){
        delete this.timeout;

        if (this.stop) return;
        if (this.nidget.textContent === "") return;
        if (this.nidget.parentElement.offsetHeight === 0) return;
        if (this.nidget.parentElement.offsetWidth === 0) return;
        if (this.nidget.style.display === "none") return;

        if (!hValue && !wValue) return;

        let hDir = this.nidget.parentElement.offsetHeight - this.nidget.scrollHeight;
        let wDir = this.nidget.parentElement.offsetWidth - this.nidget.scrollWidth;

        if (!hValue) hDir = 0;
        if (!wValue) wDir = 0;

        let dir = Math.sign(hDir | wDir); // will prefer to shrink
        if (this.direction === 0) this.direction = dir; // keep previous direction

        let fontSize = parseInt(getComputedStyle(this.nidget)["font-size"])
        let newSize = fontSize + (this.direction);

        if (newSize !== fontSize && this.direction === dir) {
            this.nidget.style.fontSize = newSize + "px";
            if (this.timeout) clearTimeout(this.timeout);
            this.timeout = setTimeout(()=>this.onResize(hValue, wValue), this.delay);
        } else if (dir < 0 && this.direction > 0) { // reverse direction if growing too large
            this.direction = -1;
            this.timeout = setTimeout(()=>this.onResize(hValue, wValue), this.delay);
        } else {
            if (this.lock === "vh") {
                let fontRatio = newSize / window.innerHeight * 100;
                this.nidget.style.fontSize = fontRatio + "vh";
                this.stop = true;
            } else if (this.lock === "vw"){
                let fontRatio = newSize / window.innerWidth * 100;
                this.nidget.style.fontSize = fontRatio + "vw";
                this.stop = true;
            }
            this.direction = 0;
        }
    }
}

/**
 * A nidget element for displaying text.
 * put '--nidget-fit-text: 1.0;' into css for this element to enable scaling.
 * see: NidgetStyle.js
 */
class NidgetText extends NidgetElement {

    constructor() {
        super();
        this.observers["fit-text-width-tolerance"] = 0.02;
        this.fitText = new FitText(this);
    }

    remove(){
        if (this.fitText) {
            this.fitText.stop = true;
            this.fitText.observer.disconnect();
        }
        super.remove();
    }

    connectedCallback() {
        super.connectedCallback();
        let fitProp = getComputedStyle(this).getPropertyValue("--nidget-fit-text");

        if (fitProp !== undefined && fitProp !== ""){
            this.fitText.listen();
        }
    }

    set text(value){
        this.innerText = value;
        if (this.fitText && this.fitText.stop === false){
            this.fitText.delayResize();
        }
    }

    get text(){
        return this.innerText;
    }

    scale(amount) {
        let styleFontSize = window.getComputedStyle(this, null).getPropertyValue("font-size");
        let fontSize = parseFloat(styleFontSize);
        this.style.fontSize = (fontSize * amount) + "px";
    }

    /**
     * Set the line height to the offset height multiplied by ratio.
     * Calling this method directory will override the value set by css
     */
    nidgetVertAlignText(value) {
        if (value) {
            this.style.setProperty("--nidget-vert-align-text", value);
        }

        let onResize = () => {
            let ratio = getComputedStyle(this).getPropertyValue("--nidget-vert-align-text");
            if (!parseFloat(ratio)) return;
            let h = this.offsetHeight * ratio;
            this.style.lineHeight = h + "px";
        }

        if (this.observers.vertAlignText === undefined) {
            this.observers.vertAlignText = new ResizeObserver(onResize);
            this.observers.vertAlignText.observe(this)
        }
        onResize()
    }

    vertAlignText(ratio = 1.0){
        if (!parseFloat(ratio)) return;
        let h = this.offsetHeight * ratio;
        this.style.lineHeight = h + "px";
    }
}
;

window.customElements.define('nidget-text', NidgetText);
module.exports = NidgetText;
},{"../NidgetElement":7}],17:[function(require,module,exports){
"use strict";
const dragHandler = require("../DragHandler").instance;


function onDragStart(event){    
    dragHandler.set(this);
    window.x = this;
    console.log("'" + this.name() + "'");
    this.notifyListeners("dragStart" + this.name(), event, this);
}

function onDragEnd(event){
    if (dragHandler.get() !== this) return;
    this.notifyListeners("dragEnd" + this.name(), event, this);
    dragHandler.clear();
}


module.exports = function(nidget){
    nidget.getElement().setAttribute("draggable", "true");   
    
    nidget.onDragStart = onDragStart.bind(nidget);
    nidget.onDragEnd = onDragEnd.bind(nidget);
    
    nidget.getElement().addEventListener("dragstart", nidget.onDragStart);
    nidget.getElement().addEventListener("dragend", nidget.onDragEnd);    
};
},{"../DragHandler":2}],18:[function(require,module,exports){
"use strict";
const dragHandler = require("../DragHandler").instance;
const MouseUtilities = require("../MouseUtilities");

function onDragOver(event){
    event.preventDefault();
    let dragNidget = dragHandler.get();
    this.notifyListeners("dragOver" + this.name(), event, this, dragNidget);
}

function onDragEnter(event){
    if (!dragHandler.has()) return;
    if (!dragHandler.pushOver(this)) return;
    this.notifyListeners("dragEnter" + this.name(), event, this);
}

function onDragLeave(event){
    if (!dragHandler.has()) return;
    if (MouseUtilities.isUnder(this.getElement())) return;
    if (!dragHandler.removeOver(this)) return;
    this.notifyListeners("dragLeave" + this.name(), event, this);
}

function onDrop(event){
    let dragNidget = dragHandler.get();
    this.notifyListeners("drop" + this.name(), event, this, dragNidget);
}

module.exports = function(nidget){
    nidget.onDragOver = onDragOver.bind(nidget);
    nidget.onDrop = onDrop.bind(nidget);
    nidget.onDragEnter = onDragEnter.bind(nidget);
    nidget.onDragLeave = onDragLeave.bind(nidget);
    
    nidget.getElement().addEventListener("dragover", nidget.onDragOver);
    nidget.getElement().addEventListener("drop", nidget.onDrop);
    nidget.getElement().addEventListener("dragenter", nidget.onDragEnter);
    nidget.getElement().addEventListener("dragleave", nidget.onDragLeave);    
};
},{"../DragHandler":2,"../MouseUtilities":5}],19:[function(require,module,exports){
"use strict";
const MouseUtilities = require("../MouseUtilities");

function onClick(event){    
    this.notifyListeners("click" + this.name(), event, this);
}

function onMouseDown(event){    
    this.notifyListeners("mouseDown" + this.name(), event, this);
}

function onMouseUp(event){    
    this.notifyListeners("mouseUp" + this.name(), event, this);
}

function onMouseEnter(event){    
    this.notifyListeners("mouseEnter" + this.name(), event, this);
}

function onMouseLeave(event){
    if (MouseUtilities.isUnder(this.getElement())) return;
    this.notifyListeners("mouseExit" + this.name(), event, this);
}

module.exports = function(nidget){
    console.log("mouse setup");
    
    nidget.onClick = onClick.bind(nidget);
    nidget.onMouseDown = onMouseDown.bind(nidget);
    nidget.onMouseUp = onMouseUp.bind(nidget);
    nidget.onMouseEnter = onMouseEnter.bind(nidget);
    nidget.onMouseLeave = onMouseLeave.bind(nidget);
    
    nidget.getElement().addEventListener("click", nidget.onClick);
    nidget.getElement().addEventListener("mousedown", nidget.onMouseDown);
    nidget.getElement().addEventListener("mouseup", nidget.onMouseUp);
    nidget.getElement().addEventListener("mouseenter", nidget.onMouseEnter);
    nidget.getElement().addEventListener("mouseout", nidget.onMouseLeave);
};

},{"../MouseUtilities":5}],20:[function(require,module,exports){
"use strict";

/**
 * Enable the nidget to be moved by dragging.  Will drag by any child eleement
 * the '.nidget-header' class, otherwise movable by clicking anywhere.
 * @param {type} e
 * @return {undefined}
 */

function onMouseMove(e){    
    e.preventDefault();
    if (!this.__movable.active) return;    

    // calculate the new cursor position:
    let deltaX = this.__movable.lastX - e.clientX;
    let deltaY = this.__movable.lastY - e.clientY;
    this.__movable.lastX = e.clientX;
    this.__movable.lastY = e.clientY;
    
    // set the element's new position:
    this.style.top = (this.offsetTop - deltaY) + "px";
    this.style.left = (this.offsetLeft - deltaX) + "px";
}

function onMouseDown(e){
    e.preventDefault();
    this.__movable.active = true;
    
    // get the mouse cursor position at startup:
    this.__movable.lastX = e.clientX;
    this.__movable.lastY = e.clientY;
}

function onMouseUp(e){
    this.__movable.active = false;
}

module.exports = function(nidget){
    nidget.__movable = {
        lastX : 0,
        lastY : 0,
        active : false
    };
    
    nidget.onMouseDown = onMouseDown.bind(nidget);        
    
    if (nidget.querySelector(".nidget-header")){
        nidget.querySelector(".nidget-header").addEventListener("mousedown", nidget.onMouseDown);        
    } else {
        nidget.addEventListener("mousedown", nidget.onMouseDown);
    }
    
    nidget.onMouseMove = onMouseMove.bind(nidget);    
    window.addEventListener("mousemove", nidget.onMouseMove);

    nidget.onMouseUp = onMouseUp.bind(nidget);    
    nidget.addEventListener("mouseup", nidget.onMouseUp);

};
},{}],21:[function(require,module,exports){
"use strict";
const Nidget = require("../Nidget");
window.Nidget = Nidget;

/**
 * Add a resize observer to the element that will call a onResize() function.
 * The parameters passed in are (previous_dimensions).  To use add
 * interfaces="resize" to the element in html and a method onResize() to the 
 * class object.  If there is no class object create a function and bind it.
 * ie: element.onResize = function.bind(element); 
 */

let onResize = function(){
    let data = this[Nidget.interfaceDataField].resize;
    let prev = data.prev;
    if (!this.onResize) return;
    this.onResize(prev);
    loadPrevious(this);
};

let loadPrevious = function(nidget){
    let data = nidget[Nidget.interfaceDataField].resize;
    data.prev = {
        width : nidget.offsetWidth,
        height : nidget.offsetHeight
    };    
};

/**
 * Setup a resize observer for the nidget that triggers the onResize method if 
 * available.
 * - onResize(this, previous_dimensions) : none
 * @param {type} nidget
 * @return {undefined}
 */
module.exports = function(nidget){
    if (typeof(nidget) !== "object") throw new "Object exected";
    let resizeObserver = new ResizeObserver(onResize.bind(nidget));
    resizeObserver.observe(nidget);
    loadPrevious(nidget);
};
},{"../Nidget":6}],22:[function(require,module,exports){
'use strict';
module.exports = {
    AbstractModel : require("./AbstractModel"),
    NidgetElement : require("./NidgetElement"),
    FileOperations : require("./FileOperations"),
    NidgetButtonSet : require("./nidget-components/NidgetButtonSet"),
    NidgetButton : require("./nidget-components/NidgetButton"),
    NidgetButtonState : require("./nidget-components/NidgetButtonState"),
    NidgetImage : require("./nidget-components/NidgetImage"),
    NidgetHTMLImage : require("./nidget-components/NidgetHTMLImage"),
    NidgetText : require("./nidget-components/NidgetText"),
    NidgetContainer : require("./nidget-components/NidgetContainer"),
    MouseUtilities : require("./MouseUtilities"),
    Constants: require("./Nidget"),
    layouts: {}
};
},{"./AbstractModel":1,"./FileOperations":3,"./MouseUtilities":5,"./Nidget":6,"./NidgetElement":7,"./nidget-components/NidgetButton":10,"./nidget-components/NidgetButtonSet":11,"./nidget-components/NidgetButtonState":12,"./nidget-components/NidgetContainer":13,"./nidget-components/NidgetHTMLImage":14,"./nidget-components/NidgetImage":15,"./nidget-components/NidgetText":16}],23:[function(require,module,exports){
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

module.exports = _assertThisInitialized;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],24:[function(require,module,exports){
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

module.exports = _asyncToGenerator;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],25:[function(require,module,exports){
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

module.exports = _classCallCheck;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],26:[function(require,module,exports){
var setPrototypeOf = require("./setPrototypeOf.js");

var isNativeReflectConstruct = require("./isNativeReflectConstruct.js");

function _construct(Parent, args, Class) {
  if (isNativeReflectConstruct()) {
    module.exports = _construct = Reflect.construct;
    module.exports["default"] = module.exports, module.exports.__esModule = true;
  } else {
    module.exports = _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) setPrototypeOf(instance, Class.prototype);
      return instance;
    };

    module.exports["default"] = module.exports, module.exports.__esModule = true;
  }

  return _construct.apply(null, arguments);
}

module.exports = _construct;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{"./isNativeReflectConstruct.js":33,"./setPrototypeOf.js":35}],27:[function(require,module,exports){
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

module.exports = _createClass;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],28:[function(require,module,exports){
var superPropBase = require("./superPropBase.js");

function _get(target, property, receiver) {
  if (typeof Reflect !== "undefined" && Reflect.get) {
    module.exports = _get = Reflect.get;
    module.exports["default"] = module.exports, module.exports.__esModule = true;
  } else {
    module.exports = _get = function _get(target, property, receiver) {
      var base = superPropBase(target, property);
      if (!base) return;
      var desc = Object.getOwnPropertyDescriptor(base, property);

      if (desc.get) {
        return desc.get.call(receiver);
      }

      return desc.value;
    };

    module.exports["default"] = module.exports, module.exports.__esModule = true;
  }

  return _get(target, property, receiver || target);
}

module.exports = _get;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{"./superPropBase.js":36}],29:[function(require,module,exports){
function _getPrototypeOf(o) {
  module.exports = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  module.exports["default"] = module.exports, module.exports.__esModule = true;
  return _getPrototypeOf(o);
}

module.exports = _getPrototypeOf;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],30:[function(require,module,exports){
var setPrototypeOf = require("./setPrototypeOf.js");

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) setPrototypeOf(subClass, superClass);
}

module.exports = _inherits;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{"./setPrototypeOf.js":35}],31:[function(require,module,exports){
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

module.exports = _interopRequireDefault;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],32:[function(require,module,exports){
function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}

module.exports = _isNativeFunction;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],33:[function(require,module,exports){
function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = _isNativeReflectConstruct;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],34:[function(require,module,exports){
var _typeof = require("@babel/runtime/helpers/typeof")["default"];

var assertThisInitialized = require("./assertThisInitialized.js");

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return assertThisInitialized(self);
}

module.exports = _possibleConstructorReturn;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{"./assertThisInitialized.js":23,"@babel/runtime/helpers/typeof":37}],35:[function(require,module,exports){
function _setPrototypeOf(o, p) {
  module.exports = _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  module.exports["default"] = module.exports, module.exports.__esModule = true;
  return _setPrototypeOf(o, p);
}

module.exports = _setPrototypeOf;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],36:[function(require,module,exports){
var getPrototypeOf = require("./getPrototypeOf.js");

function _superPropBase(object, property) {
  while (!Object.prototype.hasOwnProperty.call(object, property)) {
    object = getPrototypeOf(object);
    if (object === null) break;
  }

  return object;
}

module.exports = _superPropBase;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{"./getPrototypeOf.js":29}],37:[function(require,module,exports){
function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return typeof obj;
    };

    module.exports["default"] = module.exports, module.exports.__esModule = true;
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };

    module.exports["default"] = module.exports, module.exports.__esModule = true;
  }

  return _typeof(obj);
}

module.exports = _typeof;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{}],38:[function(require,module,exports){
var getPrototypeOf = require("./getPrototypeOf.js");

var setPrototypeOf = require("./setPrototypeOf.js");

var isNativeFunction = require("./isNativeFunction.js");

var construct = require("./construct.js");

function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;

  module.exports = _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !isNativeFunction(Class)) return Class;

    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }

    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);

      _cache.set(Class, Wrapper);
    }

    function Wrapper() {
      return construct(Class, arguments, getPrototypeOf(this).constructor);
    }

    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return setPrototypeOf(Wrapper, Class);
  };

  module.exports["default"] = module.exports, module.exports.__esModule = true;
  return _wrapNativeSuper(Class);
}

module.exports = _wrapNativeSuper;
module.exports["default"] = module.exports, module.exports.__esModule = true;
},{"./construct.js":26,"./getPrototypeOf.js":29,"./isNativeFunction.js":32,"./setPrototypeOf.js":35}],39:[function(require,module,exports){
module.exports = require("regenerator-runtime");

},{"regenerator-runtime":40}],40:[function(require,module,exports){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = define(
    GeneratorFunctionPrototype,
    toStringTagSymbol,
    "GeneratorFunction"
  );

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  define(Gp, toStringTagSymbol, "Generator");

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
  typeof module === "object" ? module.exports : {}
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}

},{}],41:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var AbstractView = /*#__PURE__*/function () {
  function AbstractView() {
    (0, _classCallCheck2["default"])(this, AbstractView);
    this.DOM = {};
    this.DOM.gameBoard = document.querySelector("game-board");
    this.DOM.questionPage = document.querySelector("#text-question");
    this.DOM.questionText = document.querySelector("#text-contents");
    this.DOM.buttons = document.querySelector("#buttons");
    this.DOM.buzzer_button = document.querySelector("#buzz");
    this.DOM.accept_button = document.querySelector("#accept_answer");
    this.DOM.reject_button = document.querySelector("#reject_answer");
    this.DOM.start_timer_button = document.querySelector("#start_timer");
    this.DOM.time_out_button = document.querySelector("#time_out");
    this.DOM.continue_button = document.querySelector("#continue");
    this.DOM.back_button = document.querySelector("#back");
    this.DOM.playing_indicator = document.querySelector("#playing");
    this.DOM.clock = document.querySelector("#clock");
    this.DOM.menuIndicator = document.querySelector("#menu-indicator");
    this.DOM.menuArea = document.querySelector("#menu-area");
    this.DOM.menuLogout = document.querySelector("#menu-logout");
    this.assertDOM(); // this.setupMenu();
  }

  (0, _createClass2["default"])(AbstractView, [{
    key: "assertDOM",
    value: function assertDOM() {
      for (var key in this.DOM) {
        console.assert(this.DOM[key] !== undefined, key);
      }
    }
  }, {
    key: "updateModel",
    value: function updateModel(update) {
      switch (update.state) {
        case 0:
          break;

        case 1:
          break;

        case 2:
          break;

        case 3:
          break;

        case 4:
          this.DOM.gameBoard.show();
          this.fillJeopardyCategories(update);
          this.fillJeopardyCells(update);
          break;

        case 5:
          this.DOM.gameBoard.show();
          this.fillJeopardyCategories(update);
          this.fillJeopardyCells(update);
          break;

        case 6:
          this.DOM.gameBoard.show();
          this.fillJeopardyCategories(update);
          this.fillJeopardyCells(update);
          break;

        case 7:
          this.DOM.gameBoard.show();
          this.fillJeopardyCategories(update);
          this.fillJeopardyCells(update);
          break;

        case 8:
          this.DOM.gameBoard.show();
          this.fillJeopardyCategories(update);
          this.fillJeopardyCells(update);
          break;

        case 9:
          this.DOM.gameBoard.show();
          this.fillJeopardyCategories(update);
          this.fillJeopardyCells(update);
          break;

        default:
          break;
      }
    }
  }, {
    key: "fillJeopardyCategories",
    value: function fillJeopardyCategories(update) {
      for (var i = 0; i < 6; i++) {
        var category = update.model.round.categories[i];
        this.DOM.gameBoard.setHeader(i, category["text"], category["font-size"], true);
      }
    }
  }, {
    key: "fillJeopardyCells",
    value: function fillJeopardyCells(update) {
      var round = update.model.round;

      for (var c = 0; c < 6; c++) {
        for (var r = 0; r < 5; r++) {
          if (round.spent[c][r]) continue;
          this.DOM.gameBoard.setCell(r, c, round.values[c][r]);
        }
      }
    }
  }]);
  return AbstractView;
}();

module.exports = AbstractView;

},{"@babel/runtime/helpers/classCallCheck":25,"@babel/runtime/helpers/createClass":27,"@babel/runtime/helpers/interopRequireDefault":31}],42:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var HostController = /*#__PURE__*/function () {
  function HostController(ws, view) {
    var _this = this;

    (0, _classCallCheck2["default"])(this, HostController);
    this.ws = ws;
    this.view = view;
    this.ws.addEventListener('message', function (event) {
      return _this.process(JSON.parse(event.data));
    });
    this.ws.addEventListener('close', function (event) {
      return _this.onClose(event);
    });

    window.start = function () {
      this.send({
        action: "start"
      });
    }.bind(this);
  }

  (0, _createClass2["default"])(HostController, [{
    key: "onUpdate",
    value: function onUpdate() {}
  }, {
    key: "process",
    value: function process(message) {
      if (message.action !== "ping") console.log(message);

      switch (message.action) {
        case "connection_established":
          this.send({
            action: "request_model"
          });
          break;

        case "update_model":
          this.view.updateModel(message.data);
          break;
      }
    }
  }, {
    key: "onClose",
    value: function onClose(event) {}
  }, {
    key: "send",
    value: function send(msg) {
      console.log("send: ".concat(JSON.stringify(msg)));
      this.ws.send(JSON.stringify(msg));
    }
  }]);
  return HostController;
}();

var _default = HostController;
exports["default"] = _default;

},{"@babel/runtime/helpers/classCallCheck":25,"@babel/runtime/helpers/createClass":27,"@babel/runtime/helpers/interopRequireDefault":31}],43:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _AbstractView2 = _interopRequireDefault(require("./AbstractView.js"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var HostView = /*#__PURE__*/function (_AbstractView) {
  (0, _inherits2["default"])(HostView, _AbstractView);

  var _super = _createSuper(HostView);

  function HostView() {
    var _this;

    (0, _classCallCheck2["default"])(this, HostView);
    _this = _super.call(this);
    _this.DOM.continueButton = document.querySelector("game-board");
    return _this;
  }

  (0, _createClass2["default"])(HostView, [{
    key: "updateModel",
    value: function updateModel(update) {
      (0, _get2["default"])((0, _getPrototypeOf2["default"])(HostView.prototype), "updateModel", this).call(this, update);

      switch (update.state) {
        case 0:
          break;

        case 1:
          break;

        case 2:
          break;

        case 3:
          break;

        case 4:
          break;

        case 5:
          break;

        case 6:
          break;

        case 7:
          break;

        case 8:
          break;

        case 9:
          break;

        default:
          break;
      }
    }
  }]);
  return HostView;
}(_AbstractView2["default"]);

var _default = HostView;
exports["default"] = _default;

},{"./AbstractView.js":41,"@babel/runtime/helpers/classCallCheck":25,"@babel/runtime/helpers/createClass":27,"@babel/runtime/helpers/get":28,"@babel/runtime/helpers/getPrototypeOf":29,"@babel/runtime/helpers/inherits":30,"@babel/runtime/helpers/interopRequireDefault":31,"@babel/runtime/helpers/possibleConstructorReturn":34}],44:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _FileOps = _interopRequireDefault(require("./modules/FileOps.js"));

var _Authenticate = _interopRequireDefault(require("./modules/Authenticate.js"));

var _HostView = _interopRequireDefault(require("./HostView.js"));

var _HostController = _interopRequireDefault(require("./HostController"));

require("./modules/GameBoard.js");

require("./modules/MultipleChoicePane.js");

require("./modules/CheckBox.js");

require("./modules/PlayerContainer.js");

require("./modules/PlayerPanel.js");

var fileOps = new _FileOps["default"]();
var model = null;
var questionPane = null;
var editorPane = null;
window.onload = /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
  var start, ws, end, time;
  return _regenerator["default"].wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          start = new Date();
          window.hostView = new _HostView["default"](); // new Menu().init("#menu");

          _context.prev = 2;
          _context.next = 5;
          return new _Authenticate["default"]().loadClient();

        case 5:
          _context.next = 7;
          return fileOps.loadClient();

        case 7:
          _context.next = 9;
          return sendTokenToServer();

        case 9:
          _context.next = 11;
          return connectWebsocket();

        case 11:
          ws = _context.sent;
          new _HostController["default"](ws, window.hostView);
          _context.next = 18;
          break;

        case 15:
          _context.prev = 15;
          _context.t0 = _context["catch"](2);
          console.log(_context.t0);

        case 18:
          end = new Date();
          time = end - start;
          console.log("Load Time " + time + " ms");

        case 21:
        case "end":
          return _context.stop();
      }
    }
  }, _callee, null, [[2, 15]]);
}));

function sendTokenToServer() {
  return new Promise(function (resolve, reject) {
    var token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
    var xhttp = new XMLHttpRequest();
    xhttp.addEventListener("load", function (event) {
      var response = JSON.parse(xhttp.responseText);
      if (response.result === "success") resolve();else reject(new Error("token rejected"));
    });
    xhttp.open("POST", "connect-host");
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify({
      token: token
    }));
  });
}

function connectWebsocket() {
  var url = window.origin;

  if (url.startsWith("http:")) {
    url = "ws" + url.substr(4) + "/game-service.ws";
  } else {
    url = "wss" + url.substr(5) + "/game-service.ws";
  }

  return new Promise(function (resolve, reject) {
    var socket = new WebSocket(url);
    socket.addEventListener('error', function (event) {
      return reject(event);
    });
    socket.addEventListener('open', function (event) {
      return resolve(socket);
    });
  });
}

},{"./HostController":42,"./HostView.js":43,"./modules/Authenticate.js":45,"./modules/CheckBox.js":46,"./modules/FileOps.js":47,"./modules/GameBoard.js":48,"./modules/MultipleChoicePane.js":49,"./modules/PlayerContainer.js":50,"./modules/PlayerPanel.js":51,"@babel/runtime/helpers/asyncToGenerator":24,"@babel/runtime/helpers/interopRequireDefault":31,"@babel/runtime/regenerator":39}],45:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

// see https://developers.google.com/drive/api/v3/quickstart/js?hl=en
var Authenticate = /*#__PURE__*/function () {
  function Authenticate() {
    (0, _classCallCheck2["default"])(this, Authenticate);
    Object.assign(this, require("./googleFields.js"));
  }

  (0, _createClass2["default"])(Authenticate, [{
    key: "loadClient",
    value: function loadClient() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        gapi.load('client:auth2', function () {
          return _this.__initClient(resolve, reject);
        });
      });
    }
  }, {
    key: "__initClient",
    value: function __initClient(resolve, reject) {
      gapi.client.init({
        apiKey: this.developerKey,
        clientId: this.clientId,
        discoveryDocs: this.discoveryDocs,
        scope: this.scope
      }).then(function (result) {
        resolve();
      }, function (error) {
        console.log("ERROR INIT");
        console.log(error);
        reject(error);
      });
    }
  }, {
    key: "isAuthorized",
    value: function isAuthorized() {
      var user = gapi.auth2.getAuthInstance().currentUser.get();
      return user.hasGrantedScopes(this.scope);
    }
  }, {
    key: "signIn",
    value: function signIn() {
      gapi.auth2.getAuthInstance().signIn();
    }
  }, {
    key: "signOut",
    value: function signOut() {
      gapi.auth2.getAuthInstance().signOut();
    }
  }]);
  return Authenticate;
}();

module.exports = Authenticate;

},{"./googleFields.js":52,"@babel/runtime/helpers/classCallCheck":25,"@babel/runtime/helpers/createClass":27,"@babel/runtime/helpers/interopRequireDefault":31}],46:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _wrapNativeSuper2 = _interopRequireDefault(require("@babel/runtime/helpers/wrapNativeSuper"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var NidgetElement = require("@Thaerious/nidget").NidgetElement;

var ValueUpadate = /*#__PURE__*/function (_CustomEvent) {
  (0, _inherits2["default"])(ValueUpadate, _CustomEvent);

  var _super = _createSuper(ValueUpadate);

  function ValueUpadate(value) {
    (0, _classCallCheck2["default"])(this, ValueUpadate);
    return _super.call(this, 'value-update', {
      detail: {
        value: value
      }
    });
  }

  return ValueUpadate;
}( /*#__PURE__*/(0, _wrapNativeSuper2["default"])(CustomEvent));

var CheckBox = /*#__PURE__*/function (_NidgetElement) {
  (0, _inherits2["default"])(CheckBox, _NidgetElement);

  var _super2 = _createSuper(CheckBox);

  function CheckBox() {
    (0, _classCallCheck2["default"])(this, CheckBox);
    return _super2.apply(this, arguments);
  }

  (0, _createClass2["default"])(CheckBox, [{
    key: "connectedCallback",
    value: function () {
      var _connectedCallback = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var _this = this;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                (0, _get2["default"])((0, _getPrototypeOf2["default"])(CheckBox.prototype), "connectedCallback", this).call(this);
                this.addEventListener("click", function () {
                  _this.toggle();
                });

              case 2:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function connectedCallback() {
        return _connectedCallback.apply(this, arguments);
      }

      return connectedCallback;
    }()
  }, {
    key: "toggle",
    value: function toggle() {
      if (this.checked === 'true') this.checked = 'false';else this.checked = 'true';
    }
  }, {
    key: "checked",
    get: function get() {
      if (!this.hasAttribute(CheckBox.CHECKED_ATTRIBUTE)) {
        this.setAttribute(CheckBox.CHECKED_ATTRIBUTE, 'false');
      }

      return this.getAttribute(CheckBox.CHECKED_ATTRIBUTE);
    },
    set: function set(value) {
      this.setAttribute(CheckBox.CHECKED_ATTRIBUTE, value);
      this.dispatchEvent(new ValueUpadate(value));
    }
  }]);
  return CheckBox;
}(NidgetElement);

CheckBox.CHECKED_ATTRIBUTE = "checked";
window.customElements.define('check-box', CheckBox);
module.exports = CheckBox;

},{"@Thaerious/nidget":22,"@babel/runtime/helpers/asyncToGenerator":24,"@babel/runtime/helpers/classCallCheck":25,"@babel/runtime/helpers/createClass":27,"@babel/runtime/helpers/get":28,"@babel/runtime/helpers/getPrototypeOf":29,"@babel/runtime/helpers/inherits":30,"@babel/runtime/helpers/interopRequireDefault":31,"@babel/runtime/helpers/possibleConstructorReturn":34,"@babel/runtime/helpers/wrapNativeSuper":38,"@babel/runtime/regenerator":39}],47:[function(require,module,exports){
"use strict"; // see https://developers.google.com/drive/api/v3/quickstart/js?hl=en

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var FileOps = /*#__PURE__*/function () {
  function FileOps() {
    (0, _classCallCheck2["default"])(this, FileOps);
  }

  (0, _createClass2["default"])(FileOps, [{
    key: "load",
    value: function () {
      var _load = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.loadClient();

              case 2:
                _context.next = 4;
                return this.loadDrive();

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function load() {
        return _load.apply(this, arguments);
      }

      return load;
    }()
  }, {
    key: "loadClient",
    value: function loadClient() {
      return new Promise(function (resolve, reject) {
        gapi.load('client', function () {
          return resolve();
        });
      });
    }
  }, {
    key: "loadDrive",
    value: function loadDrive() {
      return new Promise(function (resolve, reject) {
        gapi.client.load('drive', 'v3', resolve());
      });
    }
  }, {
    key: "create",
    value: function () {
      var _create = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var filename,
            _args2 = arguments;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                filename = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : "Game Name.json";
                return _context2.abrupt("return", new Promise(function (resolve, reject) {
                  gapi.client.drive.files.create({
                    name: filename,
                    parents: ['appDataFolder'],
                    fields: "id"
                  }).then(function (res) {
                    resolve(res.result.id);
                  }, function (error) {
                    reject(error);
                  });
                }));

              case 2:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function create() {
        return _create.apply(this, arguments);
      }

      return create;
    }()
  }, {
    key: "delete",
    value: function () {
      var _delete2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(fileId) {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                return _context3.abrupt("return", new Promise(function (resolve, reject) {
                  gapi.client.drive.files["delete"]({
                    fileId: fileId
                  }).then(function (res) {
                    resolve(res.result);
                  }, function (error) {
                    reject(error);
                  });
                }));

              case 1:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function _delete(_x) {
        return _delete2.apply(this, arguments);
      }

      return _delete;
    }()
  }, {
    key: "list",
    value: function () {
      var _list = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                return _context4.abrupt("return", new Promise(function (resolve, reject) {
                  gapi.client.drive.files.list({
                    // q: `name contains '.json'`,
                    spaces: 'appDataFolder',
                    fields: 'files/name,files/id,files/modifiedTime'
                  }).then(function (res) {
                    resolve(res.result.files);
                  }, function (error) {
                    reject(error);
                  });
                }));

              case 1:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function list() {
        return _list.apply(this, arguments);
      }

      return list;
    }()
  }, {
    key: "get",
    value: function () {
      var _get = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(fileId) {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt("return", new Promise(function (resolve, reject) {
                  gapi.client.drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                  }).then(function (res) {
                    resolve(res);
                  }, function (error) {
                    console.log(error);
                    reject(error.message);
                  });
                }));

              case 1:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      function get(_x2) {
        return _get.apply(this, arguments);
      }

      return get;
    }()
  }, {
    key: "setBody",
    value: function () {
      var _setBody = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(fileId, body) {
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                return _context6.abrupt("return", new Promise(function (resolve, reject) {
                  gapi.client.request({
                    path: "upload/drive/v3/files/" + fileId,
                    method: "PATCH",
                    params: {
                      uploadType: "media"
                    },
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: body
                  }).then(function (res) {
                    resolve(JSON.parse(res.body));
                  }, function (error) {
                    console.log(error);
                    reject(error.message);
                  });
                }));

              case 1:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6);
      }));

      function setBody(_x3, _x4) {
        return _setBody.apply(this, arguments);
      }

      return setBody;
    }()
  }, {
    key: "rename",
    value: function () {
      var _rename = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(fileId, filename) {
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                return _context7.abrupt("return", new Promise(function (resolve, reject) {
                  gapi.client.drive.files.update({
                    fileId: fileId,
                    name: filename
                  }).then(function (res) {
                    resolve(JSON.parse(res.body));
                  }, function (error) {
                    console.log(error);
                    reject(error.message);
                  });
                }));

              case 1:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7);
      }));

      function rename(_x5, _x6) {
        return _rename.apply(this, arguments);
      }

      return rename;
    }()
  }]);
  return FileOps;
}();

var _default = FileOps;
exports["default"] = _default;

},{"@babel/runtime/helpers/asyncToGenerator":24,"@babel/runtime/helpers/classCallCheck":25,"@babel/runtime/helpers/createClass":27,"@babel/runtime/helpers/interopRequireDefault":31,"@babel/runtime/regenerator":39}],48:[function(require,module,exports){
"use strict";
/** View-Controller for the HTML game board element
    This is the classical "Jeopardy" type board
    This is model agnostic, see EditorPane.js for model methods
    generates the following events:
        cell-select (row, col): when a user clicks a cell
        header-update (value, col, fontsize) : when the header text changes (and blurs)
 **/

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _wrapNativeSuper2 = _interopRequireDefault(require("@babel/runtime/helpers/wrapNativeSuper"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var NidgetElement = require("@Thaerious/nidget").NidgetElement;

var CellSelectEvent = /*#__PURE__*/function (_CustomEvent) {
  (0, _inherits2["default"])(CellSelectEvent, _CustomEvent);

  var _super = _createSuper(CellSelectEvent);

  function CellSelectEvent(row, col) {
    (0, _classCallCheck2["default"])(this, CellSelectEvent);
    return _super.call(this, 'cell-select', {
      detail: {
        row: row,
        col: col
      }
    });
  }

  return CellSelectEvent;
}( /*#__PURE__*/(0, _wrapNativeSuper2["default"])(CustomEvent));

var HeaderUpdateEvent = /*#__PURE__*/function (_CustomEvent2) {
  (0, _inherits2["default"])(HeaderUpdateEvent, _CustomEvent2);

  var _super2 = _createSuper(HeaderUpdateEvent);

  function HeaderUpdateEvent(col, value, fontSize) {
    (0, _classCallCheck2["default"])(this, HeaderUpdateEvent);
    return _super2.call(this, 'header-update', {
      detail: {
        value: value,
        col: col,
        fontSize: fontSize
      }
    });
  }

  return HeaderUpdateEvent;
}( /*#__PURE__*/(0, _wrapNativeSuper2["default"])(CustomEvent));

var GameBoard = /*#__PURE__*/function (_NidgetElement) {
  (0, _inherits2["default"])(GameBoard, _NidgetElement);

  var _super3 = _createSuper(GameBoard);

  function GameBoard() {
    (0, _classCallCheck2["default"])(this, GameBoard);
    return _super3.call(this);
  }

  (0, _createClass2["default"])(GameBoard, [{
    key: "ready",
    value: function () {
      var _ready = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var _this = this;

        var _loop, col;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(GameBoard.prototype), "ready", this).call(this);

              case 2:
                _loop = function _loop(col) {
                  _this.getHeader(col).addEventListener("input", function (event) {
                    return event.target.fitText.notify(1, 1);
                  });

                  _this.getHeader(col).addEventListener("blur", function (event) {
                    var fontSize = event.target.style["font-size"];

                    _this.dispatchEvent(new HeaderUpdateEvent(col, event.target.text, fontSize));
                  });

                  var _loop2 = function _loop2(row) {
                    _this.getCell(row, col).addEventListener("click", function () {
                      _this.dispatchEvent(new CellSelectEvent(row, col));
                    });
                  };

                  for (var row = 0; row < 5; row++) {
                    _loop2(row);
                  }
                };

                for (col = 0; col < 6; col++) {
                  _loop(col);
                }

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function ready() {
        return _ready.apply(this, arguments);
      }

      return ready;
    }()
    /**
     * Set the value of a category
     * @param index
     * @param value
     * @param value
     */

  }, {
    key: "setHeader",
    value: function setHeader(index, value, fontSize) {
      var lock = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      var element = this.getHeader(index);
      element.text = value;
      console.log(fontSize);
      if (fontSize) element.style["font-size"] = fontSize;

      if (lock) {
        element.setAttribute("contentEditable", "false");
      }
    }
    /**
     * Retrieve the header html element
     * @param index
     * @param value
     */

  }, {
    key: "getHeader",
    value: function getHeader(index) {
      if (typeof index !== "number" || index < 0 || index > 6) throw new Error("Invalid index: " + index);
      var selector = "[data-row='h'][data-col='".concat(index, "'] > .value");
      return this.querySelector(selector);
    }
    /**
     * Set the value of a non-category cell.
     * @param row
     * @param col
     * @param value
     */

  }, {
    key: "setCell",
    value: function setCell(row, col) {
      var value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
      this.getCell(row, col).textContent = value;
    }
  }, {
    key: "getCell",
    value: function getCell(row, col) {
      var selector = "[data-row=\"".concat(row, "\"][data-col=\"").concat(col, "\"] > .value");
      return this.querySelector(selector);
    }
  }, {
    key: "setComplete",
    value: function setComplete(row, col, value) {
      if (typeof row !== "number" || row < 0 || row > 6) throw new Error("Invalid row: " + row);
      if (typeof col !== "number" || col < 0 || col > 5) throw new Error("Invalid col: " + col);
      this.getCell(row, col).setAttribute("data-complete", value);
    }
  }]);
  return GameBoard;
}(NidgetElement);

window.customElements.define('game-board', GameBoard);
module.exports = GameBoard;

},{"@Thaerious/nidget":22,"@babel/runtime/helpers/asyncToGenerator":24,"@babel/runtime/helpers/classCallCheck":25,"@babel/runtime/helpers/createClass":27,"@babel/runtime/helpers/get":28,"@babel/runtime/helpers/getPrototypeOf":29,"@babel/runtime/helpers/inherits":30,"@babel/runtime/helpers/interopRequireDefault":31,"@babel/runtime/helpers/possibleConstructorReturn":34,"@babel/runtime/helpers/wrapNativeSuper":38,"@babel/runtime/regenerator":39}],49:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _wrapNativeSuper2 = _interopRequireDefault(require("@babel/runtime/helpers/wrapNativeSuper"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var NidgetElement = require("@Thaerious/nidget").NidgetElement;

require("./CheckBox.js");

var TextUpdate = /*#__PURE__*/function (_CustomEvent) {
  (0, _inherits2["default"])(TextUpdate, _CustomEvent);

  var _super = _createSuper(TextUpdate);

  function TextUpdate(index, text) {
    (0, _classCallCheck2["default"])(this, TextUpdate);
    return _super.call(this, 'text-update', {
      detail: {
        index: index,
        text: text
      }
    });
  }

  return TextUpdate;
}( /*#__PURE__*/(0, _wrapNativeSuper2["default"])(CustomEvent));

var ValueUpdate = /*#__PURE__*/function (_CustomEvent2) {
  (0, _inherits2["default"])(ValueUpdate, _CustomEvent2);

  var _super2 = _createSuper(ValueUpdate);

  function ValueUpdate(index, value) {
    (0, _classCallCheck2["default"])(this, ValueUpdate);
    return _super2.call(this, 'value-update', {
      detail: {
        index: index,
        value: value
      }
    });
  }

  return ValueUpdate;
}( /*#__PURE__*/(0, _wrapNativeSuper2["default"])(CustomEvent));

var QuestionClick = /*#__PURE__*/function (_CustomEvent3) {
  (0, _inherits2["default"])(QuestionClick, _CustomEvent3);

  var _super3 = _createSuper(QuestionClick);

  function QuestionClick() {
    (0, _classCallCheck2["default"])(this, QuestionClick);
    return _super3.call(this, 'button-question');
  }

  return QuestionClick;
}( /*#__PURE__*/(0, _wrapNativeSuper2["default"])(CustomEvent));

var MultipleChoicePane = /*#__PURE__*/function (_NidgetElement) {
  (0, _inherits2["default"])(MultipleChoicePane, _NidgetElement);

  var _super4 = _createSuper(MultipleChoicePane);

  function MultipleChoicePane() {
    (0, _classCallCheck2["default"])(this, MultipleChoicePane);
    return _super4.apply(this, arguments);
  }

  (0, _createClass2["default"])(MultipleChoicePane, [{
    key: "setModel",
    value: function setModel(model) {
      this.model = model;
    }
  }, {
    key: "ready",
    value: function () {
      var _ready = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var _this = this;

        var _iterator, _step, element, _iterator2, _step2, _element;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(MultipleChoicePane.prototype), "connectedCallback", this).call(this);

              case 2:
                _iterator = _createForOfIteratorHelper(this.querySelectorAll(".answer > nidget-text"));

                try {
                  for (_iterator.s(); !(_step = _iterator.n()).done;) {
                    element = _step.value;
                    element.fitText.lock = "vh";
                    element.addEventListener("keypress", function (event) {
                      return _this.txtListener(event);
                    });
                    element.addEventListener("blur", function (event) {
                      var index = event.target.getAttribute("data-index");

                      var text = _this.querySelector("nidget-text[data-index=\"".concat(index, "\"]")).text;

                      _this.dispatchEvent(new TextUpdate(index, text));
                    });
                  }
                } catch (err) {
                  _iterator.e(err);
                } finally {
                  _iterator.f();
                }

                _iterator2 = _createForOfIteratorHelper(this.querySelectorAll("check-box"));

                try {
                  for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                    _element = _step2.value;

                    _element.addEventListener("value-update", function (event) {
                      var index = window.getComputedStyle(event.target).getPropertyValue("--index");
                      var value = event.detail.value;

                      _this.dispatchEvent(new ValueUpdate(index, value));
                    });
                  }
                } catch (err) {
                  _iterator2.e(err);
                } finally {
                  _iterator2.f();
                }

                this.querySelector("#show-question").addEventListener("click", function () {
                  _this.dispatchEvent(new QuestionClick());
                });

              case 7:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function ready() {
        return _ready.apply(this, arguments);
      }

      return ready;
    }()
  }, {
    key: "txtListener",
    value: function txtListener(event) {
      if (event.which === 13) {
        event.stopPropagation();
        event.preventDefault();
        var index = window.getComputedStyle(event.target).getPropertyValue("--index");
        index = parseInt(index);

        if (index >= 5) {
          event.target.blur();
        } else {
          var selector = "nidget-text[data-index=\"".concat(index + 1, "\"]");
          this.querySelector(selector).focus();
        }

        return false;
      }

      event.target.fitText.notify(1, 1);
      return true;
    }
    /**
     * @param button {'question', 'answer'}
     */

  }, {
    key: "highlight",
    value: function highlight(button) {
      var _iterator3 = _createForOfIteratorHelper(this.querySelectorAll(".selected")),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var ele = _step3.value;
          ele.classList.remove("selected");
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }

      this.querySelector("#show-".concat(button)).classList.add("selected");
    }
  }, {
    key: "setText",
    value: function setText(index, text) {
      this.querySelector("nidget-text[data-index=\"".concat(index, "\"]")).text = text;
    }
  }, {
    key: "setChecked",
    value: function setChecked(index, value) {
      this.querySelector("check-box[data-index=\"".concat(index, "\"]")).checked = value;
    }
  }]);
  return MultipleChoicePane;
}(NidgetElement);

window.customElements.define('multiple-choice-pane', MultipleChoicePane);
module.exports = MultipleChoicePane;

},{"./CheckBox.js":46,"@Thaerious/nidget":22,"@babel/runtime/helpers/asyncToGenerator":24,"@babel/runtime/helpers/classCallCheck":25,"@babel/runtime/helpers/createClass":27,"@babel/runtime/helpers/get":28,"@babel/runtime/helpers/getPrototypeOf":29,"@babel/runtime/helpers/inherits":30,"@babel/runtime/helpers/interopRequireDefault":31,"@babel/runtime/helpers/possibleConstructorReturn":34,"@babel/runtime/helpers/wrapNativeSuper":38,"@babel/runtime/regenerator":39}],50:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _PlayerPanel = _interopRequireDefault(require("./PlayerPanel.js"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var NidgetElement = require("@Thaerious/nidget").NidgetElement;

var PlayerContainer = /*#__PURE__*/function (_NidgetElement) {
  (0, _inherits2["default"])(PlayerContainer, _NidgetElement);

  var _super = _createSuper(PlayerContainer);

  function PlayerContainer() {
    (0, _classCallCheck2["default"])(this, PlayerContainer);
    return _super.call(this);
  }

  (0, _createClass2["default"])(PlayerContainer, [{
    key: "ready",
    value: function () {
      var _ready = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(PlayerContainer.prototype), "ready", this).call(this);

              case 2:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function ready() {
        return _ready.apply(this, arguments);
      }

      return ready;
    }()
  }, {
    key: "addPlayer",
    value: function addPlayer(name) {
      var score = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var element = document.createElement("player-panel");
      element.name = name;
      element.score = score;
      this.append(element);
    }
  }]);
  return PlayerContainer;
}(NidgetElement);

window.customElements.define('player-container', PlayerContainer);
module.exports = PlayerContainer;

},{"./PlayerPanel.js":51,"@Thaerious/nidget":22,"@babel/runtime/helpers/asyncToGenerator":24,"@babel/runtime/helpers/classCallCheck":25,"@babel/runtime/helpers/createClass":27,"@babel/runtime/helpers/get":28,"@babel/runtime/helpers/getPrototypeOf":29,"@babel/runtime/helpers/inherits":30,"@babel/runtime/helpers/interopRequireDefault":31,"@babel/runtime/helpers/possibleConstructorReturn":34,"@babel/runtime/regenerator":39}],51:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

require("./PlayerPanel.js");

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var NidgetElement = require("@Thaerious/nidget").NidgetElement;

var PlayerPanel = /*#__PURE__*/function (_NidgetElement) {
  (0, _inherits2["default"])(PlayerPanel, _NidgetElement);

  var _super = _createSuper(PlayerPanel);

  function PlayerPanel() {
    (0, _classCallCheck2["default"])(this, PlayerPanel);
    return _super.call(this);
  }

  (0, _createClass2["default"])(PlayerPanel, [{
    key: "ready",
    value: function () {
      var _ready = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(PlayerPanel.prototype), "ready", this).call(this);

              case 2:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function ready() {
        return _ready.apply(this, arguments);
      }

      return ready;
    }()
  }, {
    key: "name",
    get: function get() {
      return this.querySelector("#name").text;
    },
    set: function set(value) {
      this.querySelector("#name").text = value;
    }
  }, {
    key: "score",
    get: function get() {
      return this.querySelector("#score").text;
    },
    set: function set(value) {
      this.querySelector("#score").text = value;
    }
  }, {
    key: "buzz",
    value: function buzz() {
      this.querySelector("#buzz-light").classList.add("sweep-right");
      this.querySelector("#name").classList.add("active");
      this.querySelector("#score").classList.add("active");
    }
  }, {
    key: "clear",
    value: function clear() {
      this.querySelector("#buzz-light").classList.remove("sweep-right");
      this.querySelector("#name").classList.remove("active");
      this.querySelector("#score").classList.remove("active");
      this.querySelectorAll(".clock-tick").forEach(function (e) {
        return e.classList.remove("spent");
      });
    }
  }, {
    key: "setTimer",
    value: function setTimer(percent) {
      if (percent <= 80) this.querySelector(".clock-tick[data-index='4']").classList.add("spent");
      if (percent <= 60) this.querySelector(".clock-tick[data-index='3']").classList.add("spent");
      if (percent <= 40) this.querySelector(".clock-tick[data-index='2']").classList.add("spent");
      if (percent <= 20) this.querySelector(".clock-tick[data-index='1']").classList.add("spent");
      if (percent <= 0) this.querySelector(".clock-tick[data-index='0']").classList.add("spent");
    }
  }]);
  return PlayerPanel;
}(NidgetElement);

window.customElements.define('player-panel', PlayerPanel);
module.exports = PlayerPanel;

},{"./PlayerPanel.js":51,"@Thaerious/nidget":22,"@babel/runtime/helpers/asyncToGenerator":24,"@babel/runtime/helpers/classCallCheck":25,"@babel/runtime/helpers/createClass":27,"@babel/runtime/helpers/get":28,"@babel/runtime/helpers/getPrototypeOf":29,"@babel/runtime/helpers/inherits":30,"@babel/runtime/helpers/interopRequireDefault":31,"@babel/runtime/helpers/possibleConstructorReturn":34,"@babel/runtime/regenerator":39}],52:[function(require,module,exports){
"use strict";

module.exports = {
  // The Browser API key obtained from the Google API Console.
  developerKey: 'AIzaSyABcdLmT6HH_7Go82q_IBGI3jm6UL4w4Q0',
  // The Client ID obtained from the Google API Console. Replace with your own Client ID.
  clientId: "158823134681-98bgkangoltk636ukf8pofeis7pa7jbk.apps.googleusercontent.com",
  // Replace with your own project number from console.developers.google.com.
  appId: "158823134681",
  // Array of API discovery doc URLs for APIs used by the quickstart
  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  // Scope to use to access user's Drive items.
  scope: "https://www.googleapis.com/auth/drive.file"
};

},{}]},{},[44])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL2VkL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi4uLy4uL25pZGdldC9zcmMvQWJzdHJhY3RNb2RlbC5qcyIsIi4uLy4uL25pZGdldC9zcmMvRHJhZ0hhbmRsZXIuanMiLCIuLi8uLi9uaWRnZXQvc3JjL0ZpbGVPcGVyYXRpb25zLmpzIiwiLi4vLi4vbmlkZ2V0L3NyYy9JbnRlcmZhY2VzLmpzIiwiLi4vLi4vbmlkZ2V0L3NyYy9Nb3VzZVV0aWxpdGllcy5qcyIsIi4uLy4uL25pZGdldC9zcmMvTmlkZ2V0LmpzIiwiLi4vLi4vbmlkZ2V0L3NyYy9OaWRnZXRFbGVtZW50LmpzIiwiLi4vLi4vbmlkZ2V0L3NyYy9OaWRnZXRTdHlsZS5qcyIsIi4uLy4uL25pZGdldC9zcmMvVHJhbnNmb3JtZXIuanMiLCIuLi8uLi9uaWRnZXQvc3JjL25pZGdldC1jb21wb25lbnRzL05pZGdldEJ1dHRvbi5qcyIsIi4uLy4uL25pZGdldC9zcmMvbmlkZ2V0LWNvbXBvbmVudHMvTmlkZ2V0QnV0dG9uU2V0LmpzIiwiLi4vLi4vbmlkZ2V0L3NyYy9uaWRnZXQtY29tcG9uZW50cy9OaWRnZXRCdXR0b25TdGF0ZS5qcyIsIi4uLy4uL25pZGdldC9zcmMvbmlkZ2V0LWNvbXBvbmVudHMvTmlkZ2V0Q29udGFpbmVyLmpzIiwiLi4vLi4vbmlkZ2V0L3NyYy9uaWRnZXQtY29tcG9uZW50cy9OaWRnZXRIVE1MSW1hZ2UuanMiLCIuLi8uLi9uaWRnZXQvc3JjL25pZGdldC1jb21wb25lbnRzL05pZGdldEltYWdlLmpzIiwiLi4vLi4vbmlkZ2V0L3NyYy9uaWRnZXQtY29tcG9uZW50cy9OaWRnZXRUZXh0LmpzIiwiLi4vLi4vbmlkZ2V0L3NyYy9uaWRnZXQtaW50ZXJmYWNlcy9EcmFnLmpzIiwiLi4vLi4vbmlkZ2V0L3NyYy9uaWRnZXQtaW50ZXJmYWNlcy9Ecm9wLmpzIiwiLi4vLi4vbmlkZ2V0L3NyYy9uaWRnZXQtaW50ZXJmYWNlcy9Nb3VzZS5qcyIsIi4uLy4uL25pZGdldC9zcmMvbmlkZ2V0LWludGVyZmFjZXMvTW92YWJsZS5qcyIsIi4uLy4uL25pZGdldC9zcmMvbmlkZ2V0LWludGVyZmFjZXMvUmVzaXplLmpzIiwiLi4vLi4vbmlkZ2V0L3NyYy9wcm9qZWN0RmlsZS5qcyIsIm5vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2Fzc2VydFRoaXNJbml0aWFsaXplZC5qcyIsIm5vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2FzeW5jVG9HZW5lcmF0b3IuanMiLCJub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9jbGFzc0NhbGxDaGVjay5qcyIsIm5vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2NvbnN0cnVjdC5qcyIsIm5vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2NyZWF0ZUNsYXNzLmpzIiwibm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZ2V0LmpzIiwibm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZ2V0UHJvdG90eXBlT2YuanMiLCJub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9pbmhlcml0cy5qcyIsIm5vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2ludGVyb3BSZXF1aXJlRGVmYXVsdC5qcyIsIm5vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2lzTmF0aXZlRnVuY3Rpb24uanMiLCJub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QuanMiLCJub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuLmpzIiwibm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvc2V0UHJvdG90eXBlT2YuanMiLCJub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9zdXBlclByb3BCYXNlLmpzIiwibm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvdHlwZW9mLmpzIiwibm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvd3JhcE5hdGl2ZVN1cGVyLmpzIiwibm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL3JlZ2VuZXJhdG9yL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlZ2VuZXJhdG9yLXJ1bnRpbWUvcnVudGltZS5qcyIsInNyYy9jbGllbnQvQWJzdHJhY3RWaWV3LmpzIiwic3JjL2NsaWVudC9Ib3N0Q29udHJvbGxlci5qcyIsInNyYy9jbGllbnQvSG9zdFZpZXcuanMiLCJzcmMvY2xpZW50L2hvc3RfcG9ydGFsLmpzIiwic3JjL2NsaWVudC9tb2R1bGVzL0F1dGhlbnRpY2F0ZS5qcyIsInNyYy9jbGllbnQvbW9kdWxlcy9DaGVja0JveC5qcyIsInNyYy9jbGllbnQvbW9kdWxlcy9GaWxlT3BzLmpzIiwic3JjL2NsaWVudC9tb2R1bGVzL0dhbWVCb2FyZC5qcyIsInNyYy9jbGllbnQvbW9kdWxlcy9NdWx0aXBsZUNob2ljZVBhbmUuanMiLCJzcmMvY2xpZW50L21vZHVsZXMvUGxheWVyQ29udGFpbmVyLmpzIiwic3JjL2NsaWVudC9tb2R1bGVzL1BsYXllclBhbmVsLmpzIiwic3JjL2NsaWVudC9tb2R1bGVzL2dvb2dsZUZpZWxkcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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b250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCc7XHJcbmNsYXNzIEFic3RyYWN0TW9kZWwge1xyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSBuZXcgYWJzdHJhY3QgbW9kZWwuICBJZiBkZWxlZ2F0ZSBpcyBwcm92aWRlZCB0aGVuIGFsbCBsaXN0ZW5lclxyXG4gICAgICogYWRkcyBhbmQgbm90aWZpZXMgYXJlIHBlcmZvcm1lZCBvbiB0aGUgZGVsZWdhdGUgbGlzdGVuZXIgY29sbGVjdGlvbi5cclxuICAgICAqIEBwYXJhbSB7dHlwZX0gZGVsZWdhdGVcclxuICAgICAqIEByZXR1cm5zIHtubSRfQWJzdHJhY3RNb2RlbC5BYnN0cmFjdE1vZGVsfVxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmRlbGVnYXRlID0gdGhpcztcclxuICAgICAgICB0aGlzLmFic3RyYWN0TW9kZWxMaXN0ZW5lcnMgPSBbXTsgICAgICAgIFxyXG4gICAgfVxyXG5cclxuICAgIGdldERlbGVnYXRlKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVsZWdhdGU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHNldERlbGVnYXRlKGRlbGVnYXRlID0gbnVsbCl7XHJcbiAgICAgICAgaWYgKGRlbGVnYXRlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGVsZWdhdGUgPSB0aGlzO1xyXG4gICAgICAgICAgICB0aGlzLmFic3RyYWN0TW9kZWxMaXN0ZW5lcnMgPSBbXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRlbGVnYXRlID0gZGVsZWdhdGUuZGVsZWdhdGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh0aGlzLmRlbGVnYXRlID09PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmRlZmluZWQgZGVsZWdhdGVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBhZGRMaXN0ZW5lcihsaXN0ZW5lcikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09IFwib2JqZWN0XCIpe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIEFic3RyYWN0TW9kZWwgbGlzdGVuZXIgdHlwZTogXCIgKyB0eXBlb2YgbGlzdGVuZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmRlbGVnYXRlLmFic3RyYWN0TW9kZWxMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsIGFzIG5vdGlmeUxpc3RlbmVycyhtZXRob2ROYW1lLCBbbWV0aG9kQXJndW1lbnQwLCAuLi4gbWV0aG9kQXJndW1lbnROXSlcclxuICAgICAqIEBwYXJhbSB7dHlwZX0gbWV0aG9kXHJcbiAgICAgKiBAcmV0dXJucyB7dW5kZWZpbmVkfVxyXG4gICAgICovXHJcbiAgICBhc3luYyBub3RpZnlMaXN0ZW5lcnMobWV0aG9kKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJFVkVOVCBcIiArIHRoaXMuZGVsZWdhdGUuY29uc3RydWN0b3IubmFtZSArIFwiIFwiICsgbWV0aG9kKTtcclxuXHJcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnNoaWZ0LmFwcGx5KGFyZ3VtZW50cyk7XHJcbiAgICAgICAgbGV0IGV2ZW50ID0ge1xyXG4gICAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcclxuICAgICAgICAgICAgYXJnczogYXJndW1lbnRzLFxyXG4gICAgICAgICAgICBzb3VyY2U6IHRoaXMsXHJcbiAgICAgICAgICAgIGxpc3RlbmVyczogW11cclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHdpbmRvdy5sYXN0RXZlbnQgPSBldmVudDtcclxuICAgICAgICB3aW5kb3cubkV2ZW50cy5wdXNoKHdpbmRvdy5sYXN0RXZlbnQpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLmRlbGVnYXRlLmFic3RyYWN0TW9kZWxMaXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyW21ldGhvZF0pe1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIgKyBcIiArIGxpc3RlbmVyLmNvbnN0cnVjdG9yLm5hbWUgKyBcIiBcIiArIG1ldGhvZCk7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cubGFzdEV2ZW50Lmxpc3RlbmVycy5wdXNoKGxpc3RlbmVyLmNvbnN0cnVjdG9yLm5hbWUpOyAgICAgICBcclxuICAgICAgICAgICAgICAgIGF3YWl0IGxpc3RlbmVyW21ldGhvZF0uYXBwbHkobGlzdGVuZXIsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGxpc3RlbmVyW0Fic3RyYWN0TW9kZWwuZGVmYXVsdExpc3RlbmVyXSl7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiArIFwiICsgbGlzdGVuZXIuY29uc3RydWN0b3IubmFtZSArIFwiIFwiICsgQWJzdHJhY3RNb2RlbC5kZWZhdWx0TGlzdGVuZXIpO1xyXG4gICAgICAgICAgICAgICAgd2luZG93Lmxhc3RFdmVudC5saXN0ZW5lcnMucHVzaChsaXN0ZW5lci5jb25zdHJ1Y3Rvci5uYW1lKTsgICAgICAgXHJcbiAgICAgICAgICAgICAgICBhd2FpdCBsaXN0ZW5lcltBYnN0cmFjdE1vZGVsLmRlZmF1bHRMaXN0ZW5lcl0uYXBwbHkobGlzdGVuZXIsIHdpbmRvdy5sYXN0RXZlbnQpOyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuQWJzdHJhY3RNb2RlbC5kZWZhdWx0TGlzdGVuZXIgPSBcIm5pZGdldExpc3RlbmVyXCI7XHJcbndpbmRvdy5uRXZlbnRzID0gW107XHJcbm1vZHVsZS5leHBvcnRzID0gQWJzdHJhY3RNb2RlbDsiLCIndXNlIHN0cmljdCc7XHJcbi8qKlxyXG4gKiBTaW5nbGV0b24gY2xhc3MgdG8gcHJvdmlkaW5nIGZ1bmN0aW9uYWxpdHkgdG8gRHJhZ05pZGdldHMgYW5kIERyb3BOaWRnZXRzLlxyXG4gKiBJdCBzdG9yZXMgdGhlIE5pZGdldCBjdXJyZW50bHkgYmVpbmcgZHJhZ2dlZC5cclxuICovXHJcbmNsYXNzIERyYWdIYW5kbGVye1xyXG4gICAgXHJcbiAgICBjb25zdHJ1Y3Rvcigpe1xyXG4gICAgICAgIHRoaXMuY3VycmVudCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5vdmVyID0gW107XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1c2hPdmVyKG5pZGdldCl7XHJcbiAgICAgICAgaWYgKHRoaXMub3ZlckhhcyhuaWRnZXQpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5vdmVyLnB1c2gobmlkZ2V0KTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVtb3ZlT3ZlcihuaWRnZXQpe1xyXG4gICAgICAgIGlmICghdGhpcy5vdmVySGFzKG5pZGdldCkpIHJldHVybiBmYWxzZTtcclxuICAgICAgICB0aGlzLm92ZXIuc3BsaWNlKHRoaXMub3Zlci5pbmRleE9mKG5pZGdldCksIDEpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSAgICBcclxuICAgIFxyXG4gICAgb3ZlckhhcyhuaWRnZXQpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLm92ZXIuaW5kZXhPZihuaWRnZXQpICE9PSAtMTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgc2V0KG5pZGdldCl7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gbmlkZ2V0O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBnZXQoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBoYXMoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50ICE9PSBudWxsO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjbGVhcigpe1xyXG4gICAgICAgIHRoaXMuY3VycmVudCA9IG51bGw7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHN0YXRpYyBnZXRJbnN0YW5jZSgpe1xyXG4gICAgICAgIHJldHVybiBEcmFnSGFuZGxlci5pbnN0YW5jZTtcclxuICAgIH0gICAgXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IERyYWdIYW5kbGVyKCk7XHJcblxyXG4iLCIndXNlIHN0cmljdCc7XHJcbmNvbnN0IE5pZGdldEVsZW1lbnQgPSByZXF1aXJlKFwiLi9OaWRnZXRFbGVtZW50XCIpO1xyXG5cclxuLyogZ2xvYmFsIFV0aWxpdHkgKi9cclxuY2xhc3MgRmlsZU9wZXJhdGlvbnMge1xyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSBuZXcgZG9tIGVsZW1lbnQgZnJvbSBhIGZpbGUgKHVybCkuICBNYXAgdmFyaWFibGVzICgkey4uLn0pIHRvIFxyXG4gICAgICogYSB2YWx1ZS5cclxuICAgICAqIEBwYXJhbSB7dHlwZX0gdXJsXHJcbiAgICAgKiBAcGFyYW0ge3R5cGV9IG1hcFxyXG4gICAgICogQHJldHVybnMge25vZGV8RmlsZU9wZXJhdGlvbnMubG9hZERPTUVsZW1lbnQuZG9tRWxlbWVudH1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGxvYWROaWRnZXQodXJsLCBtYXApeyAgICAgICAgXHJcbiAgICAgICAgbGV0IGVsZW1lbnQgPSBhd2FpdCBGaWxlT3BlcmF0aW9ucy5sb2FkRE9NRWxlbWVudCh1cmwsIG1hcCk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBOaWRnZXRFbGVtZW50KGVsZW1lbnQpO1xyXG4gICAgfSAgICBcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSBuZXcgZG9tIGVsZW1lbnQgZnJvbSBhIGZpbGUgKHVybCkuICBNYXAgdmFyaWFibGVzICgkey4uLn0pIHRvIFxyXG4gICAgICogYSB2YWx1ZS5cclxuICAgICAqIEBwYXJhbSB7dHlwZX0gdXJsXHJcbiAgICAgKiBAcGFyYW0ge3R5cGV9IG1hcFxyXG4gICAgICogQHJldHVybnMge25vZGV8RmlsZU9wZXJhdGlvbnMubG9hZERPTUVsZW1lbnQuZG9tRWxlbWVudH1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFzeW5jIGxvYWRET01FbGVtZW50KHVybCwgbWFwID0gbmV3IE1hcCgpKXsgICAgICAgIFxyXG4gICAgICAgIGlmIChtYXAgaW5zdGFuY2VvZiBNYXAgPT09IGZhbHNlKSBtYXAgPSBGaWxlT3BlcmF0aW9ucy5vYmplY3RUb01hcChtYXApOyAgICAgICBcclxuICAgICAgICBsZXQgdGV4dCA9IGF3YWl0IEZpbGVPcGVyYXRpb25zLmdldFVSTCh1cmwpO1xyXG4gICAgICAgIHJldHVybiBGaWxlT3BlcmF0aW9ucy5zdHJpbmdUb0RPTUVsZW1lbnQodGV4dCwgbWFwKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhIG5ldyBkb20gZWxlbWVudCBmcm9tIHRleHQuXHJcbiAgICAgKiBAcGFyYW0ge3R5cGV9IHRleHRcclxuICAgICAqIEBwYXJhbSB7dHlwZX0gbWFwXHJcbiAgICAgKiBAcmV0dXJucyB7bm9kZXxGaWxlT3BlcmF0aW9ucy5sb2FkRE9NRWxlbWVudC5kb21FbGVtZW50fVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgc3RyaW5nVG9ET01FbGVtZW50KHRleHQsIG1hcCA9IG5ldyBNYXAoKSl7XHJcbiAgICAgICAgLyogcmVwbGFjZSB2YXJpYWJsZXMgd2l0aCB2YWx1ZXMgKi9cclxuICAgICAgICBmb3IgKGxldCBrZXkgb2YgbWFwLmtleXMoKSl7ICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IG1hcC5nZXQoa2V5KTtcclxuICAgICAgICAgICAgbGV0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgWyRdW3tdPyR7a2V5fVt9XWAsIGBnYCk7XHJcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UocmVnZXgsIHZhbHVlKTsgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiByZXBsYWNlIHVuZmlsbGVkIHZhcmlhYmxlcyB3aXRoIGVtcHR5ICovXHJcbiAgICAgICAgbGV0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgWyRdW3tdW159XSpbfV1gLCBgZ2ApO1xyXG4gICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UocmVnZXgsIFwiXCIpOyBcclxuXHJcbiAgICAgICAgbGV0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBlbGVtZW50LmlubmVySFRNTCA9IHRleHQ7XHJcbiAgICAgICAgbGV0IGRvbUVsZW1lbnQgPSBudWxsO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGVsZW1lbnQpO1xyXG5cclxuICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgb2JqZWN0VG9NYXAob2JqZWN0KXtcclxuICAgICAgICBsZXQgbWFwID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIGZvciAobGV0IGZpZWxkIGluIG9iamVjdCl7ICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0W2ZpZWxkXSA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2Ygb2JqZWN0W2ZpZWxkXSA9PT0gXCJudW1iZXJcIil7XHJcbiAgICAgICAgICAgICAgICBtYXAuc2V0KGZpZWxkLCBvYmplY3RbZmllbGRdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgfVxyXG5cclxuICAgIFxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBUcmFuc2ZlciBjb250ZW50cyBvZiAnZmlsZW5hbWUnIGZyb20gc2VydmVyIHRvIGNsaWVudC5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlbmFtZVxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gc3VjY2Vzc0NhbGxiYWNrXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBlcnJvckNhbGxiYWNrXHJcbiAgICAgKiBAcmV0dXJucyB7U3RyaW5nfSBjb250ZW50cyBvZiBmaWxlXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBnZXRVUkwodXJsKSB7XHJcbiAgICAgICAgbGV0IGNhbGxiYWNrID0gZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICB2YXIgeGh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHJcbiAgICAgICAgICAgIHhodHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmICh4aHR0cC5yZWFkeVN0YXRlID09PSA0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHhodHRwLnN0YXR1cyA9PT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeGh0dHAucmVzcG9uc2VUZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3Qoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeGh0dHAgOiB4aHR0cCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1cyA6IHhodHRwLnN0YXR1cywgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0IDogeGh0dHAucmVzcG9uc2VUZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsIDogdXJsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHhodHRwLm9wZW4oXCJHRVRcIiwgdXJsLCB0cnVlKTtcclxuICAgICAgICAgICAgeGh0dHAuc2VuZChudWxsKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIGEgbmV3IGRvbSBlbGVtZW50IGZyb20gdGV4dC5cclxuICAgICAqIEBwYXJhbSB7dHlwZX0gdGV4dFxyXG4gICAgICogQHBhcmFtIHt0eXBlfSBtYXBcclxuICAgICAqIEByZXR1cm5zIHtub2RlfEZpbGVPcGVyYXRpb25zLmxvYWRET01FbGVtZW50LmRvbUVsZW1lbnR9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhc3luYyBnZXRGaWxlKHVybCwgbWFwID0gbmV3IE1hcCgpKXtcclxuICAgICAgICBsZXQgdGV4dCA9IGF3YWl0IEZpbGVPcGVyYXRpb25zLmdldFVSTCh1cmwpO1xyXG5cclxuICAgICAgICAvKiByZXBsYWNlIHZhcmlhYmxlcyB3aXRoIHZhbHVlcyAqL1xyXG4gICAgICAgIGZvciAobGV0IGtleSBvZiBtYXAua2V5cygpKXtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gbWFwLmdldChrZXkpO1xyXG4gICAgICAgICAgICBsZXQgcmVnZXggPSBuZXcgUmVnRXhwKGBbJF1be10/JHtrZXl9W31dYCwgYGdgKTtcclxuICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShyZWdleCwgdmFsdWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyogcmVwbGFjZSB1bmZpbGxlZCB2YXJpYWJsZXMgd2l0aCBlbXB0eSAqL1xyXG4gICAgICAgIGxldCByZWdleCA9IG5ldyBSZWdFeHAoYFskXVt7XVtefV0qW31dYCwgYGdgKTtcclxuICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKHJlZ2V4LCBcIlwiKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAqIFRyYW5zZmVyIGNvbnRlbnRzIG9mICdmaWxlbmFtZScgZnJvbSBzZXJ2ZXIgdG8gY2xpZW50IHVzaW5nIGN1cnJlbnQgd2luZG93IGxvY2F0aW9uLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGZpbGVuYW1lXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBzdWNjZXNzQ2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGVycm9yQ2FsbGJhY2tcclxuICAgICAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBnZXRMb2NhbChmaWxlbmFtZSkge1xyXG4gICAgICAgIGxldCBjYWxsYmFjayA9IGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdmFyIHhodHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0ge307XHJcbiAgICAgICAgICAgIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZiArIFwiL1wiICsgZmlsZW5hbWU7XHJcblxyXG4gICAgICAgICAgICB4aHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoeGh0dHAucmVhZHlTdGF0ZSA9PT0gNCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh4aHR0cC5zdGF0dXMgPT09IDIwMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHhodHRwLnJlc3BvbnNlVGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHhodHRwLnN0YXR1cywgeGh0dHAucmVzcG9uc2VUZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB4aHR0cC5vcGVuKFwiR0VUXCIsIHVybCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHhodHRwLnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShjYWxsYmFjayk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogQ2F1c2UgJ3RleHQnIHRvIGJlIHNhdmVkIGFzICdmaWxlbmFtZScgY2xpZW50IHNpZGUuXHJcbiAgICAgKiBAcGFyYW0ge3R5cGV9IGZpbGVuYW1lIFRoZSBkZWZhdWx0IGZpbGVuYW1lIHRvIHNhdmUgdGhlIHRleHQgYXMuXHJcbiAgICAgKiBAcGFyYW0ge3R5cGV9IHRleHQgVGhlIHRleHQgdG8gc2F2ZSB0byBmaWxlbmFtZS5cclxuICAgICAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBzYXZlVG9GaWxlKHRleHQsIGZpbGVuYW1lKSB7XHJcbiAgICAgICAgbGV0IGFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgICAgICBsZXQgZGF0YSA9IFwidGV4dDtjaGFyc2V0PXV0Zi04LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHRleHQpO1xyXG4gICAgICAgIGFuY2hvci5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwiZGF0YTpcIiArIGRhdGEpO1xyXG4gICAgICAgIGFuY2hvci5zZXRBdHRyaWJ1dGUoXCJkb3dubG9hZFwiLCBmaWxlbmFtZSk7XHJcbiAgICAgICAgYW5jaG9yLmNsaWNrKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbkZpbGVPcGVyYXRpb25zLk5vZGVUeXBlID0ge1xyXG4gICAgRUxFTUVOVCA6IDEsXHJcbiAgICBBVFRSSUJVVEUgOiAyLFxyXG4gICAgVEVYVCA6IDMsIFxyXG4gICAgQ0RBVEFTRUNUSU9OIDogNCxcclxuICAgIEVOVElUWVJFRkVSTkNFIDogNSxcclxuICAgIEVOVElUWSA6IDYsXHJcbiAgICBQUk9DRVNTSU5HSU5TVFJVQ1RJT04gOiA3LFxyXG4gICAgQ09NTUVOVCA6IDgsXHJcbiAgICBET0NVTUVOVCA6IDksXHJcbiAgICBET0NVTUVOVFRZUEUgOiAxMCxcclxuICAgIERPQ1VNRU5URlJBR01FTlQgOiAxMSxcclxuICAgIE5PVEFUSU9OIDogMTJcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRmlsZU9wZXJhdGlvbnM7IiwiJ3VzZSBzdHJpY3QnO1xyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG1vdXNlIDogcmVxdWlyZShcIi4vbmlkZ2V0LWludGVyZmFjZXMvTW91c2VcIiksIFxyXG4gICAgZHJhZyA6IHJlcXVpcmUoXCIuL25pZGdldC1pbnRlcmZhY2VzL0RyYWdcIiksXHJcbiAgICBkcm9wIDogcmVxdWlyZShcIi4vbmlkZ2V0LWludGVyZmFjZXMvRHJvcFwiKSxcclxuICAgIG1vdmFibGUgOiByZXF1aXJlKFwiLi9uaWRnZXQtaW50ZXJmYWNlcy9Nb3ZhYmxlXCIpLFxyXG4gICAgcmVzaXplIDogcmVxdWlyZShcIi4vbmlkZ2V0LWludGVyZmFjZXMvUmVzaXplXCIpXHJcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4vKipcclxuICogU2luZ2x0b24gY2xhc3MgdG8gYWRkIGZ1bmN0aW9uYWxpdHkgdG8gdGhlIG1vdXNlLlxyXG4gKi9cclxuY2xhc3MgTW91c2VVdGlsaXRpZXMge1xyXG4gICAgXHJcbiAgICBjb25zdHJ1Y3Rvcigpe1xyXG4gICAgICAgIHRoaXMuYXR0YWNoZWRFbGVtZW50ID0gbnVsbDtcclxuICAgICAgICB0aGlzLmxhc3RYID0gMDtcclxuICAgICAgICB0aGlzLmxhc3RZID0gMDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgaXNVbmRlcihldmVudCwgZWxlbWVudCkge1xyXG4gICAgICAgIGxldCB4ID0gZXZlbnQuY2xpZW50WDtcclxuICAgICAgICBsZXQgeSA9IGV2ZW50LmNsaWVudFk7XHJcbiAgICAgICAgbGV0IGN1cnJlbnQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHgsIHkpO1xyXG5cclxuICAgICAgICB3aGlsZSAoY3VycmVudCkge1xyXG4gICAgICAgICAgICBpZiAoY3VycmVudCA9PT0gZWxlbWVudCkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRVbmRlcihldmVudCkge1xyXG4gICAgICAgIGxldCB4ID0gZXZlbnQuY2xpZW50WDtcclxuICAgICAgICBsZXQgeSA9IGV2ZW50LmNsaWVudFk7XHJcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoeCwgeSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IGVsZW1lbnQoZWxlbWVudCl7XHJcbiAgICAgICAgaWYgKHRoaXMuYXR0YWNoZWRFbGVtZW50ICE9PSBudWxsKXtcclxuICAgICAgICAgICAgdGhpcy5kZXRhY2hFbGVtZW50KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghZWxlbWVudCB8fCBlbGVtZW50ID09PSBudWxsIHx8IGVsZW1lbnQgPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgIHRoaXMuZGV0YWNoRWxlbWVudCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoRWxlbWVudChlbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGdldCBlbGVtZW50KCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0YWNoZWRFbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0YWNoIGFuIGVsZW1lbnQuICBJZiB0aGUgZWxlbWVudCBkb2Vzbid0IGhhdmUgYSBwYXJlbnQgaXQgd2lsbCBiZVxyXG4gICAgICogYXR0YWNoZWQgdG8gdGhlIGRvY3VtZW50IGFuZCB3aWxsIGJlIGRldGFjaGVkIHdoZW4gZGV0YWNoRWxlbWVudCBpcyBjYWxsZWQuXHJcbiAgICAgKiBAcGFyYW0ge3R5cGV9IGVsZW1lbnRcclxuICAgICAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAgICAgKi9cclxuICAgIGF0dGFjaEVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIHRoaXMuYXR0YWNoZWRFbGVtZW50ID0gZWxlbWVudDtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoZWxlbWVudC5wYXJlbnQpe1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4gbm90IGF0dGFjaCBlbGVtZW50IHRvIG1vdXNlIGlmIHRoZSBlbGVtZW50IGhhcyBhIHBhcmVudCBlbGVtZW50LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZChlbGVtZW50KTtcclxuICAgICAgICBlbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiOyBcclxuICAgICAgICBlbGVtZW50LnN0eWxlLnRvcCA9IGV2ZW50LmNsaWVudFkgKyBcInB4XCI7XHJcbiAgICAgICAgZWxlbWVudC5zdHlsZS5sZWZ0ID0gZXZlbnQuY2xpZW50WCArIFwicHhcIjtcclxuICAgICAgICBlbGVtZW50LnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIm5vbmVcIjtcclxuICAgICAgICBlbGVtZW50LnN0eWxlLnpJbmRleCA9IFwiMTAwMDBcIjtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm1vdmVDYWxsQmFjayA9IChldmVudCk9PnRoaXMub25Nb3VzZU1vdmUoZXZlbnQpO1xyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMubW92ZUNhbGxCYWNrKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBsaXN0ZW5lcnMgZnJvbSB0aGUgYXR0YWNoZWQgZWxlbWVudCwgZG8gbm90IHJlbW92ZSBpdCBmcm9tIHRoZVxyXG4gICAgICogZG9jdW1lbnQuXHJcbiAgICAgKiBAcmV0dXJucyB7dHlwZX1cclxuICAgICAqL1xyXG4gICAgZGV0YWNoRWxlbWVudCgpe1xyXG4gICAgICAgIGlmICh0aGlzLmF0dGFjaGVkRWxlbWVudCA9PT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMubW92ZUNhbGxCYWNrKTsgICAgICAgIFxyXG4gICAgICAgIGxldCBydmFsdWUgPSB0aGlzLmF0dGFjaGVkRWxlbWVudDtcclxuICAgICAgICB0aGlzLmF0dGFjaGVkRWxlbWVudCA9IG51bGw7ICAgICAgICBcclxuICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHJ2YWx1ZSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHJ2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBvbk1vdXNlTW92ZShldmVudCkgeyAgICAgICAgXHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLmxhc3RYID0gZXZlbnQuY2xpZW50WDtcclxuICAgICAgICB0aGlzLmxhc3RZID0gZXZlbnQuY2xpZW50WTtcclxuXHJcbiAgICAgICAgLy8gc2V0IHRoZSBlbGVtZW50J3MgbmV3IHBvc2l0aW9uOlxyXG4gICAgICAgIHRoaXMuYXR0YWNoZWRFbGVtZW50LnN0eWxlLnRvcCA9IGV2ZW50LmNsaWVudFkgKyBcInB4XCI7XHJcbiAgICAgICAgdGhpcy5hdHRhY2hlZEVsZW1lbnQuc3R5bGUubGVmdCA9IGV2ZW50LmNsaWVudFggKyBcInB4XCI7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IE1vdXNlVXRpbGl0aWVzKCk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBwcmVmaXg6IFwiZGF0YS1uaWRnZXRcIixcclxuICAgIGVsZW1lbnRBdHRyaWJ1dGU6IFwiZGF0YS1uaWRnZXQtZWxlbWVudFwiLFxyXG4gICAgc3JjQXR0cmlidXRlOiBcInNyY1wiLFxyXG4gICAgdGVtcGxhdGVTcmNBdHRyaWJ1dGU6IFwidGVtcGxhdGUtc3JjXCIsXHJcbiAgICBuYW1lQXR0cmlidXRlOiBcIm5hbWVcIixcclxuICAgIGludGVyZmFjZUF0dHJpYnV0ZTogXCJpbnRlcmZhY2VzXCIsXHJcbiAgICB0ZW1wbGF0ZUF0dHJpYnV0ZTogXCJ0ZW1wbGF0ZS1pZFwiLFxyXG4gICAgaW50ZXJmYWNlRGF0YUZpZWxkOiBcImludGVyZmFjZURhdGFcIixcclxuICAgIG1vZGVsRGF0YUZpZWxkOiBcIm1vZGVsRGF0YVwiLFxyXG4gICAgc3R5bGVBdHRyaWJ1dGU6IFwibmlkZ2V0LXN0eWxlXCJcclxufTsiLCJcInVzZSBzdHJpY3RcIjtcclxuY29uc3QgRmlsZU9wZXJhdGlvbnMgPSByZXF1aXJlKFwiLi9GaWxlT3BlcmF0aW9uc1wiKTtcclxuY29uc3QgTmlkZ2V0ID0gcmVxdWlyZShcIi4vTmlkZ2V0XCIpO1xyXG5jb25zdCBJbnRlcmZhY2VzID0gcmVxdWlyZShcIi4vSW50ZXJmYWNlc1wiKTtcclxuY29uc3QgVHJhbnNmb3JtZXIgPSByZXF1aXJlKFwiLi9UcmFuc2Zvcm1lclwiKTtcclxuY29uc3QgTmlkZ2V0U3R5bGUgPSByZXF1aXJlKFwiLi9OaWRnZXRTdHlsZVwiKTtcclxuXHJcbi8qKlxyXG4gKiBDYWxjdWxhdGUgdGhlIHc6aCBhc3BlY3QgcmF0aW8gYW5kIGFkanVzdCB0aGUgcHJvcG9ydGlvbnMgYWNjb3JkaW5nbHkuXHJcbiAqXHJcbiAqL1xyXG5jbGFzcyBBc3BlY3RSYXRpb3tcclxuICAgIGNvbnN0cnVjdG9yKG5pZGdldCkge1xyXG4gICAgICAgIHRoaXMubmlkZ2V0ID0gbmlkZ2V0O1xyXG4gICAgICAgIHRoaXMub2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoKCk9PnRoaXMub25SZXNpemUoKSk7XHJcbiAgICAgICAgdGhpcy5vYnNlcnZlci5vYnNlcnZlKHRoaXMubmlkZ2V0KTtcclxuICAgICAgICB0aGlzLnBhcnNlVmFsdWVzKCk7XHJcbiAgICAgICAgdGhpcy5vblJlc2l6ZSgpO1xyXG4gICAgICAgIHRoaXMubG9hZGVkID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VmFsdWUoKXtcclxuICAgICAgICByZXR1cm4gZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLm5pZGdldCkuZ2V0UHJvcGVydHlWYWx1ZShBc3BlY3RSYXRpby5DU1NfQVRUUklCVVRFKTtcclxuICAgIH1cclxuXHJcbiAgICBwYXJzZVZhbHVlcygpe1xyXG4gICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZ2V0VmFsdWUoKTtcclxuICAgICAgICBsZXQgc3BsaXQgPSB2YWx1ZS5zcGxpdCgvWyAsO10vZyk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IHMgb2Ygc3BsaXQpe1xyXG4gICAgICAgICAgICBpZiAocy5zcGxpdCgvWy06XS8pLmxlbmd0aCA9PT0gMil7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmF0aW8gPSBzLnNwbGl0KC9bLTpdLyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gcGFyc2VJbnQocmF0aW9bMF0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBwYXJzZUludChyYXRpb1sxXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAocyA9PT0gXCJoXCIpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vblJlc2l6ZSA9ICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBoZWlnaHQgPSB0aGlzLm5pZGdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uaWRnZXQuc3R5bGUud2lkdGggPSAoaGVpZ2h0ICogdGhpcy53aWR0aCAvIHRoaXMuaGVpZ2h0KSArIFwicHhcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG9uUmVzaXplKCl7XHJcbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy5uaWRnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGg7XHJcbiAgICAgICAgdGhpcy5uaWRnZXQuc3R5bGUuaGVpZ2h0ID0gKHdpZHRoICogdGhpcy5oZWlnaHQgLyB0aGlzLndpZHRoKSArIFwicHhcIjtcclxuICAgIH1cclxufVxyXG5cclxuQXNwZWN0UmF0aW8uQ1NTX0FUVFJJQlVURSA9IFwiLS1uaWRnZXQtYXNwZWN0LXJhdGlvXCI7XHJcblxyXG4vKipcclxuICogQSBOaWRnZXRFbGVtZW50IGlzIGEgMToxIGNsYXNzLW9iamVjdDpkb20tb2JqZWN0IHBhaXJpbmcuICBBY3Rpb25zIG9uIHRoZSBET00gXHJcbiAqIG9iamVjdCBzaG91bGQgb25seSBiZSBjYWxsZWQgYnkgdGhlIE5pZGdldEVsZW1lbnQgb2JqZWN0LiAgVGhlIGludGVyZmFjZURhdGFcclxuICogZmllbGQgaXMgcmVzZXJ2ZWQgZm9yIGRhdGEgZnJvbSBpbnRlcmZhY2VzLiAgSW50ZXJmYWNlcyBzaG91bGQgcHV0IHRoZWlyIFxyXG4gKiBjdXN0b20gZGF0YSB1bmRlciBbaW50ZXJmYWNlRGF0YUZpZWxkXS5baW50ZXJmYWNlTmFtZV0uICBUaGUgaW50ZXJmYWNlIGRhdGFcclxuICogYXR0cmlidXRlIGlzIHNldCB3aXRoIHRoZSBzdGF0aWMgdmFsdWUgTmlkZ2V0LmludGVyZmFjZURhdGFGaWVsZC5cclxuICogXHJcbiAqIENhbGxpbmcgbWV0aG9kcyBvbiB0aGUgbmlkZ2V0IHdpbGwgdHJlYXQgc2hhZG93IGNvbnRlbnRzIGFzIHJlZ3VsYXIgY29udGVudHMuXHJcbiAqL1xyXG5jbGFzcyBOaWRnZXRFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSBuZXcgTmlkZ2V0IGFzc29jaWF0ZWQgd2l0aCAnZWxlbWVudCcuICBBbiBlcnJvciB3aWxsIGJlIHRocm93blxyXG4gICAgICogaWYgdGhlICdlbGVtZW50JyBpcyBhbHJlYWR5IGFzc29jaWF0ZWQgd2l0aCBhIE5pZGdldC5cclxuICAgICAqIFxyXG4gICAgICogRGlzYWJsZWQgY2xhc3MgaW5kaWNhdGVzIHRoaXMgbmlkZ2V0IHdpbGwgaWdub3JlIG1vdXNlIGV2ZW50cy5cclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHt0eXBlfSBlbGVtZW50IEpRdWVyeSBzZWxlY3RvclxyXG4gICAgICogQHJldHVybiB7bm0kX05pZGdldC5OaWRnZXRFbGVtZW50fVxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih0ZW1wbGF0ZUlkKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzW05pZGdldC5pbnRlcmZhY2VEYXRhRmllbGRdID0ge307XHJcbiAgICAgICAgdGhpc1tOaWRnZXQubW9kZWxEYXRhRmllbGRdID0ge307XHJcbiAgICAgICAgdGhpcy50cmFuc2Zvcm1lciA9IG5ldyBUcmFuc2Zvcm1lcih0aGlzKTtcclxuICAgICAgICB0aGlzLm9ic2VydmVycyA9IHt9O1xyXG5cclxuICAgICAgICBpZiAodGVtcGxhdGVJZCl7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwbHlUZW1wbGF0ZSh0ZW1wbGF0ZUlkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICAgY29ubmVjdGVkQ2FsbGJhY2sgaXMgaW52b2tlZCBlYWNoIHRpbWUgdGhlIGN1c3RvbSBlbGVtZW50IGlzIGFwcGVuZGVkIGludG8gYSBkb2N1bWVudC1jb25uZWN0ZWQgZWxlbWVudFxyXG4gICAgICovXHJcbiAgICBhc3luYyBjb25uZWN0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICB0aGlzLnNoYWRvd0NvbnRlbnRzID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaGFzQXR0cmlidXRlKE5pZGdldC50ZW1wbGF0ZUF0dHJpYnV0ZSkpe1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFwcGx5VGVtcGxhdGUodGhpcy5nZXRBdHRyaWJ1dGUoTmlkZ2V0LnRlbXBsYXRlQXR0cmlidXRlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm5vdGlmeVN0eWxlcygpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0cmlldmUgYSBtYXAgb2YgYWxsIGRhdGEgYXR0cmlidXRlc1xyXG4gICAgICogQHJldHVybnMge01hcDxhbnksIGFueT59XHJcbiAgICAgKi9cclxuICAgIGRhdGFBdHRyaWJ1dGVzKCkge1xyXG4gICAgICAgIGxldCBtYXAgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgZm9yIChsZXQgYXR0ciBvZiB0aGlzLmF0dHJpYnV0ZXMpIHtcclxuICAgICAgICAgICAgaWYgKGF0dHIubmFtZS5zdGFydHNXaXRoKFwiZGF0YS1cIikpIHtcclxuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gYXR0ci5uYW1lLnN1YnN0cig1KTtcclxuICAgICAgICAgICAgICAgIG1hcFtuYW1lXSA9IGF0dHIudmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgIH1cclxuXHJcbiAgICBub3RpZnlTdHlsZXMoKXtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBhciA9IGdldENvbXB1dGVkU3R5bGUodGhpcykuZ2V0UHJvcGVydHlWYWx1ZShBc3BlY3RSYXRpby5DU1NfQVRUUklCVVRFKTtcclxuICAgICAgICAgICAgICAgIGlmIChhciAhPT0gXCJcIikgbmV3IEFzcGVjdFJhdGlvKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9LCAxMDApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0YWNoIGEgc2hhZG93IGVsZW1lbnQgd2l0aCB0aGUgY29udGVudHMgb2YgdGhlIHRlbXBsYXRlIG5hbWVkICh0ZW1wbGF0ZUlEKS5cclxuICAgICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cclxuICAgICAqL1xyXG4gICAgYXN5bmMgYXBwbHlUZW1wbGF0ZSh0ZW1wbGF0ZUlkKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc2hhZG93Um9vdCAhPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIGxldCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRlbXBsYXRlSWQpO1xyXG5cclxuICAgICAgICBpZiAoIXRlbXBsYXRlKSB0aHJvdyBuZXcgRXJyb3IoXCJUZW1wbGF0ZSAnXCIgKyB0ZW1wbGF0ZUlkICsgXCInIG5vdCBmb3VuZC5cIik7XHJcbiAgICAgICAgaWYgKHRlbXBsYXRlLnRhZ05hbWUudG9VcHBlckNhc2UoKSAhPT0gXCJURU1QTEFURVwiKSB0aHJvdyBuZXcgRXJyb3IoXCJFbGVtZW50IHdpdGggaWQgJ1wiICsgdGVtcGxhdGVJZCArIFwiJyBpcyBub3QgYSB0ZW1wbGF0ZS5cIik7XHJcblxyXG4gICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHttb2RlOiAnb3Blbid9KS5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5jb250ZW50LmNsb25lTm9kZSh0cnVlKSk7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5yZWFkeSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJlYWR5KCl7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTG9hZCBjb250ZW50cyBvZiBmaWxlIGludG8gdGhpcyBlbGVtZW50LlxyXG4gICAgICogUmVwbGFjZSBhbGwgJHt9IHZhcmlhYmxlcyB3aXRoIGNvbnRlbnRzIG9mICdtYXAnLlxyXG4gICAgICovXHJcbiAgICBhc3luYyByZXRyaWV2ZVNvdXJjZShtYXApe1xyXG4gICAgICAgIGxldCBzcmMgPSB0aGlzLmdldEF0dHJpYnV0ZShOaWRnZXQuc3JjQXR0cmlidXRlKTtcclxuICAgICAgICBsZXQgdGV4dCA9IGF3YWl0IEZpbGVPcGVyYXRpb25zLmdldEZpbGUoc3JjLCBtYXApO1xyXG4gICAgICAgIHRoaXMuaW5uZXJIVE1MID0gdGV4dDtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgbG9hZFRlbXBsYXRlU25pcHBldChmaWxlbmFtZSwgdGFnbmFtZSl7XHJcbiAgICAgICAgbGV0IGlkID0gZmlsZW5hbWUucmVwbGFjZSgvW1xcLy8gLi1dKy9nLCBcIl9cIik7XHJcblxyXG4gICAgICAgIGlmICghZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgIyR7aWR9YCkpe1xyXG4gICAgICAgICAgICBsZXQgdGV4dCA9IGF3YWl0IEZpbGVPcGVyYXRpb25zLmdldEZpbGUoZmlsZW5hbWUpO1xyXG4gICAgICAgICAgICBsZXQgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XHJcbiAgICAgICAgICAgIHRlbXBsYXRlLmlubmVySFRNTCA9IHRleHQ7XHJcbiAgICAgICAgICAgIHRlbXBsYXRlLnNldEF0dHJpYnV0ZShcImlkXCIsIGlkKTtcclxuICAgICAgICAgICAgaWYgKHRhZ25hbWUpIHRlbXBsYXRlLnNldEF0dHJpYnV0ZShcImRhdGEtbmlkZ2V0XCIsIHRhZ25hbWUpO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZCh0ZW1wbGF0ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjJHtpZH1gKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgZWxlIG9mIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGFnbmFtZSkpe1xyXG4gICAgICAgICAgICBhd2FpdCBlbGUuaW5qZWN0VGVtcGxhdGUodGVtcGxhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSAnaGlkZGVuJyBjbGFzcy5cclxuICAgICAqL1xyXG4gICAgc2hvdygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGQgJ2hpZGRlbicgY2xhc3MuXHJcbiAgICAgKi9cclxuICAgIGhpZGUoKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IHRoZSBkaXNhYmxlZCBmbGFnIHRoYXQgaXMgcmVhZCBieSBuaWRnZXQgbW91c2UgZnVuY3Rpb25zLlxyXG4gICAgICogQHBhcmFtIHZhbHVlXHJcbiAgICAgKi9cclxuICAgIHNldCBkaXNhYmxlZCh2YWx1ZSl7XHJcbiAgICAgICAgaWYgKHZhbHVlID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKE5pZGdldEVsZW1lbnQuRElTQUJMRURfQVRUUklCVVRFLCB0cnVlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShOaWRnZXRFbGVtZW50LkRJU0FCTEVEX0FUVFJJQlVURSwgZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgZGlzYWJsZWQgZmxhZyB0aGF0IGlzIHJlYWQgYnkgbmlkZ2V0IG1vdXNlIGZ1bmN0aW9ucy5cclxuICAgICAqIEBwYXJhbSB2YWx1ZVxyXG4gICAgICovXHJcbiAgICBnZXQgZGlzYWJsZWQoKXtcclxuICAgICAgICBpZiAoIXRoaXMuaGFzQXR0cmlidXRlKE5pZGdldEVsZW1lbnQuRElTQUJMRURfQVRUUklCVVRFKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZShOaWRnZXRFbGVtZW50LkRJU0FCTEVEX0FUVFJJQlVURSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGlzIGVsZW1lbnQgd2FzIHVuZGVyIHRoZSBtb3VzZSBmb3IgdGhlIGV2ZW50LlxyXG4gICAgICogQHBhcmFtIHt0eXBlfSBldmVudFxyXG4gICAgICogQHBhcmFtIHt0eXBlfSBlbGVtZW50XHJcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxyXG4gICAgICovXHJcbiAgICBpc1VuZGVyTW91c2UoZXZlbnQpIHtcclxuICAgICAgICBsZXQgeCA9IGV2ZW50LmNsaWVudFg7XHJcbiAgICAgICAgbGV0IHkgPSBldmVudC5jbGllbnRZO1xyXG4gICAgICAgIGxldCBjdXJyZW50ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh4LCB5KTtcclxuXHJcbiAgICAgICAgd2hpbGUgKGN1cnJlbnQpIHtcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnQgPT09IHRoaXMpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSdW4gdGhlIHF1ZXJ5IHNlbGVjdG9yIG9uIHRoaXMgZWxlbWVudC5cclxuICAgICAqIElmIHRoaXMgZWxlbWVudCBoYXMgYSBzaGFkb3csIHJ1biBpdCBvbiB0aGF0IGluc3RlYWQuXHJcbiAgICAgKiBAcGFyYW0gc2VsZWN0b3JzXHJcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdfVxyXG4gICAgICovXHJcbiAgIHF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3JzKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc2hhZG93Um9vdCl7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNoYWRvd1Jvb3QucXVlcnlTZWxlY3RvcihzZWxlY3RvcnMpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzdXBlci5xdWVyeVNlbGVjdG9yKHNlbGVjdG9ycyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUnVuIHRoZSBxdWVyeSBzZWxlY3RvciBvbiB0aGlzIGVsZW1lbnQuXHJcbiAgICAgKiBJZiB0aGlzIGVsZW1lbnQgaGFzIGEgc2hhZG93LCBydW4gaXQgb24gdGhhdCBpbnN0ZWFkLlxyXG4gICAgICogQHBhcmFtIHNlbGVjdG9yc1xyXG4gICAgICogQHJldHVybnMge0hUTUxFbGVtZW50VGFnTmFtZU1hcFtLXX1cclxuICAgICAqL1xyXG4gICAgcXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcnMpIHtcclxuICAgICAgICBpZiAodGhpcy5zaGFkb3dSb290KXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9ycyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN1cGVyLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3JzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgdGhpcyBlbGVtZW50IGZyb20gaXQncyBwYXJlbnQuXHJcbiAgICAgKi9cclxuICAgIGRldGFjaCgpe1xyXG4gICAgICAgIHRoaXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEluZGV4IHdpdGhpbiB0aGUgcGFyZW50IGVsZW1lbnQuXHJcbiAgICAgKi9cclxuICAgIGluZGV4KCl7XHJcbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5wYXJlbnRFbGVtZW50LmNoaWxkcmVuKS5pbmRleE9mKHRoaXMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5OaWRnZXRFbGVtZW50LkRJU0FCTEVEX0FUVFJJQlVURSA9IFwibmlkZ2V0LWRpc2FibGVkXCI7XHJcbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ25pZGdldC1lbGVtZW50JywgTmlkZ2V0RWxlbWVudCk7XHJcbm1vZHVsZS5leHBvcnRzID0gTmlkZ2V0RWxlbWVudDsiLCIndXNlIHN0cmljdCc7XHJcbi8qKlxyXG4gKiBNYW5pcHVsYXRlcyB0aGUgZWxlbWVudHMgc3R5bGUgd2l0aCBqcyByb3V0aW5lcyBhY2NvcmRpbmcgdG8gY3NzIGZsYWdzLlxyXG4gKiBOaWRnZXQgc3R5bGUgaXMgYXBwbGllZCB0byBhbGwgbmlkZ2V0LWVsZW1lbnRzIHVubGVzcyB0aGV5IGhhdmUgdGhlIG5pZGdldC1zdHlsZVxyXG4gKiBhdHRyaWJ1dGUgc2V0IHRvICdmYWxzZScuXHJcbiAqL1xyXG5cclxuY2xhc3MgTmlkZ2V0U3R5bGUge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG5pZGdldCkge1xyXG4gICAgICAgIHRoaXMubmlkZ2V0ID0gbmlkZ2V0O1xyXG4gICAgICAgIHRoaXMuYXBwbHkoKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgYXBwbHkoKSB7XHJcbiAgICAgICAgdGhpcy5uaWRnZXRXaWR0aFJhdGlvKCk7XHJcbiAgICAgICAgdGhpcy5uaWRnZXRIZWlnaHRSYXRpbygpO1xyXG4gICAgICAgIHRoaXMubmlkZ2V0Rml0VGV4dCgpO1xyXG4gICAgICAgIHRoaXMubmlkZ2V0Rml0VGV4dFdpZHRoKCk7XHJcbiAgICAgICAgdGhpcy5uaWRnZXRWZXJ0QWxpZ25UZXh0KCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIG5pZGdldFdpZHRoUmF0aW8oKSB7XHJcbiAgICAgICAgbGV0IHJhdGlvID0gZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLm5pZGdldCkuZ2V0UHJvcGVydHlWYWx1ZShcIi0tbmlkZ2V0LXdpZHRoLXJhdGlvXCIpO1xyXG4gICAgICAgIGlmICghcGFyc2VGbG9hdChyYXRpbykpIHJldHVybjsgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgbmV3IFJlc2l6ZU9ic2VydmVyKCgpID0+IHsgICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5uaWRnZXQud2lkdGggPSB0aGlzLm5pZGdldC5oZWlnaHQgKiByYXRpbztcclxuICAgICAgICB9KS5vYnNlcnZlKHRoaXMubmlkZ2V0KTsgICAgICBcclxuICAgIH1cclxuICAgIFxyXG4gICAgbmlkZ2V0SGVpZ2h0UmF0aW8oKSB7XHJcbiAgICAgICAgbGV0IHJhdGlvID0gZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLm5pZGdldCkuZ2V0UHJvcGVydHlWYWx1ZShcIi0tbmlkZ2V0LWhlaWdodC1yYXRpb1wiKTtcclxuICAgICAgICBpZiAoIXBhcnNlRmxvYXQocmF0aW8pKSByZXR1cm47ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgICAgIG5ldyBSZXNpemVPYnNlcnZlcigoKSA9PiB7ICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMubmlkZ2V0LmhlaWdodCA9IHRoaXMubmlkZ2V0LndpZHRoICogcmF0aW87XHJcbiAgICAgICAgfSkub2JzZXJ2ZSh0aGlzLm5pZGdldCk7ICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaWxsIHRoZSB0ZXh0IGhlaWdodCB0byBtYXRjaCB0aGUgZWxlbWVudCBoZWlnaHQuXHJcbiAgICAgKiBDaGFuZ2UgdGhlIHJhdGlvIHZhbHVlIChvciB0aGUgZm9udFNpemUpIGFkanVzdC5cclxuICAgICAqL1xyXG4gICAgbmlkZ2V0Rml0VGV4dCgpIHtcclxuICAgICAgICBsZXQgcmF0aW8gPSBnZXRDb21wdXRlZFN0eWxlKHRoaXMubmlkZ2V0KS5nZXRQcm9wZXJ0eVZhbHVlKFwiLS1uaWRnZXQtZml0LXRleHRcIik7ICAgICAgICBcclxuICAgICAgICBpZiAoIXBhcnNlRmxvYXQocmF0aW8pKSByZXR1cm47XHJcblxyXG4gICAgICAgIG5ldyBSZXNpemVPYnNlcnZlcigoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAtLW5pZGdldC1maXQtdGV4dCAke3JhdGlvfWApXHJcbiAgICAgICAgICAgIGxldCBoID0gdGhpcy5uaWRnZXQub2Zmc2V0SGVpZ2h0ICogcmF0aW87XHJcbiAgICAgICAgICAgIHRoaXMubmlkZ2V0LnN0eWxlLmZvbnRTaXplID0gaCArIFwicHhcIjtcclxuICAgICAgICB9KS5vYnNlcnZlKHRoaXMubmlkZ2V0KTsgICAgICBcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqICBXaWxsIGNoYW5nZSB0aGUgZm9udCBzaXplIHNvIHRoYXQgdGhlIHRleHQgZml0J3MgaW4gdGhlIHBhcmVudCBlbGVtZW50LlxyXG4gICAgICogIERvbid0IHNldCB0aGUgd2lkdGggb2YgdGhlIGVsZW1lbnQuXHJcbiAgICAgKi9cclxuICAgIG5pZGdldEZpdFRleHRXaWR0aCgpIHtcclxuICAgICAgICBsZXQgcmVtb3ZlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLm5pZGdldCkuZ2V0UHJvcGVydHlWYWx1ZShcIi0tbmlkZ2V0LWZpdC10ZXh0LXdpZHRoXCIpO1xyXG4gICAgICAgIGlmICghcGFyc2VGbG9hdChyZW1vdmUpKSByZXR1cm47XHJcblxyXG4gICAgICAgIG5ldyBSZXNpemVPYnNlcnZlcigoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMubmlkZ2V0LnBhcmVudEVsZW1lbnRcclxuXHJcbiAgICAgICAgICAgIGxldCB0ZXh0VyA9IHRoaXMubmlkZ2V0LnNjcm9sbFdpZHRoO1xyXG4gICAgICAgICAgICBsZXQgY29udFcgPSB0aGlzLm5pZGdldC5wYXJlbnRFbGVtZW50Lm9mZnNldFdpZHRoO1xyXG4gICAgICAgICAgICBjb250VyA9IGNvbnRXIC0gcmVtb3ZlO1xyXG4gICAgICAgICAgICBsZXQgZHcgPSBjb250Vy90ZXh0VztcclxuICAgICAgICAgICAgbGV0IGNvbXB1dGVkRm9udFNpemUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLm5pZGdldCwgbnVsbCkuZ2V0UHJvcGVydHlWYWx1ZSgnZm9udC1zaXplJylcclxuICAgICAgICAgICAgY29tcHV0ZWRGb250U2l6ZSA9IHBhcnNlSW50KGNvbXB1dGVkRm9udFNpemUpO1xyXG4gICAgICAgICAgICBjb21wdXRlZEZvbnRTaXplID0gTWF0aC5yb3VuZChjb21wdXRlZEZvbnRTaXplKTtcclxuICAgICAgICAgICAgbGV0IG5ld0ZvbnRTaXplID0gTWF0aC5yb3VuZChjb21wdXRlZEZvbnRTaXplICogZHcpO1xyXG4gICAgICAgICAgICBsZXQgaCA9IHRoaXMubmlkZ2V0Lm9mZnNldEhlaWdodFxyXG5cclxuICAgICAgICAgICAgaWYgKE1hdGguYWJzKGNvbXB1dGVkRm9udFNpemUgLSBuZXdGb250U2l6ZSkgPD0gMikgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgaWYgKG5ld0ZvbnRTaXplID4gaCkgbmV3Rm9udFNpemUgPSBoO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5uaWRnZXQuc3R5bGUuZm9udFNpemUgPSBuZXdGb250U2l6ZSArIFwicHhcIjtcclxuICAgICAgICB9KS5vYnNlcnZlKHRoaXMubmlkZ2V0KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCB0aGUgbGluZSBoZWlnaHQgdG8gdGhlIG9mZnNldCBoZWlnaHQgbXVsdGlwbGllZCBieSByYXRpby5cclxuICAgICAqL1xyXG4gICAgbmlkZ2V0VmVydEFsaWduVGV4dCgpe1xyXG4gICAgICAgIGxldCByYXRpbyA9IGdldENvbXB1dGVkU3R5bGUodGhpcy5uaWRnZXQpLmdldFByb3BlcnR5VmFsdWUoXCItLW5pZGdldC12ZXJ0LWFsaWduLXRleHRcIik7XHJcbiAgICAgICAgaWYgKCFwYXJzZUZsb2F0KHJhdGlvKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBuZXcgUmVzaXplT2JzZXJ2ZXIoKCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgaCA9IHRoaXMubmlkZ2V0Lm9mZnNldEhlaWdodCAqIHJhdGlvO1xyXG4gICAgICAgICAgICB0aGlzLm5pZGdldC5zdHlsZS5saW5lSGVpZ2h0ID0gaCArIFwicHhcIjtcclxuICAgICAgICB9KS5vYnNlcnZlKHRoaXMubmlkZ2V0KTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBOaWRnZXRTdHlsZTsiLCIndXNlIHN0cmljdCc7XHJcbmNsYXNzIFRyYW5zZm9ybXtcclxuICAgIGNvbnN0cnVjdG9yKHZhbHVlKXtcclxuICAgICAgICBsZXQgaW5kZXhPZiA9IHZhbHVlLmluZGV4T2YoXCIoXCIpO1xyXG4gICAgICAgIHRoaXMubmFtZSA9IHZhbHVlLnN1YnN0cmluZygwLCBpbmRleE9mKTtcclxuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKHRoaXMubmFtZS5sZW5ndGggKyAxLCB2YWx1ZS5sZW5ndGggLSAxKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLm5hbWUgKyBcIiwgXCIgKyB0aGlzLnZhbHVlKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdG9TdHJpbmcoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5uYW1lICsgXCIoXCIgKyB0aGlzLnZhbHVlICsgXCIpXCI7XHJcbiAgICB9ICAgIFxyXG59XHJcblxyXG5jbGFzcyBUcmFuc2Zvcm1lciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGFwcGVuZCgpe1xyXG4gICAgICAgIGxldCBjb21wdXRlZFN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy5lbGVtZW50KVtcInRyYW5zZm9ybVwiXTtcclxuICAgICAgICBpZiAoY29tcHV0ZWRTdHlsZSAhPT0gXCJub25lXCIpIHRoaXMucHVzaChjb21wdXRlZFN0eWxlKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIFxyXG4gICAgY2xlYXIoKXtcclxuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gXCJcIjtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIFxyXG4gICAgdW5zaGlmdCh2YWx1ZSl7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IHZhbHVlICsgXCIgXCIgKyB0aGlzLmVsZW1lbnQuc3R5bGUudHJhbnNmb3JtO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdXNoKHZhbHVlKXtcclxuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gdGhpcy5lbGVtZW50LnN0eWxlLnRyYW5zZm9ybSArIFwiIFwiICsgdmFsdWU7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9ICAgIFxyXG4gICAgXHJcbiAgICBzaGlmdCgpe1xyXG4gICAgICAgIGxldCBhcnJheSA9IHRoaXMuc3BsaXQoKTtcclxuICAgICAgICBpZiAoYXJyYXkubGVuZ3RoID09PSAwKSByZXR1cm4gXCJcIjtcclxuICAgICAgICBhcnJheS5zaGlmdCgpO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSBhcnJheS5qb2luKFwiIFwiKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIFxyXG4gICAgcG9wKCl7XHJcbiAgICAgICAgbGV0IGFycmF5ID0gdGhpcy5zcGxpdCgpO1xyXG4gICAgICAgIGlmIChhcnJheS5sZW5ndGggPT09IDApIHJldHVybiBcIlwiO1xyXG4gICAgICAgIGFycmF5LnBvcCgpO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSBhcnJheS5qb2luKFwiIFwiKTtcclxuICAgICAgICByZXR1cm4gdGhpczsgICAgICBcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmVwbGFjZSh2YWx1ZSl7XHJcbiAgICAgICAgbGV0IG5ld1RyYW5zZm9ybSA9IG5ldyBUcmFuc2Zvcm0odmFsdWUpO1xyXG4gICAgICAgIGxldCBhcnJheSA9IHRoaXMuc3BsaXQoKTtcclxuICAgICAgICBcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgbGV0IGVudHJ5ID0gYXJyYXlbaV07XHJcbiAgICAgICAgICAgIGxldCB0cmFuc2Zvcm0gPSBuZXcgVHJhbnNmb3JtKGVudHJ5KTtcclxuICAgICAgICAgICAgaWYgKHRyYW5zZm9ybS5uYW1lID09PSBuZXdUcmFuc2Zvcm0ubmFtZSl7XHJcbiAgICAgICAgICAgICAgICBhcnJheVtpXSA9IG5ld1RyYW5zZm9ybS50b1N0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IGFycmF5LmpvaW4oXCIgXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHNwbGl0KCl7XHJcbiAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5lbGVtZW50LnN0eWxlLnRyYW5zZm9ybTtcclxuICAgICAgICBsZXQgc3RhcnQgPSAwO1xyXG4gICAgICAgIGxldCBydmFsdWUgPSBbXTtcclxuICAgICAgICBsZXQgbGFzdCA9ICcnO1xyXG4gICAgICAgIGxldCBza2lwID0gZmFsc2U7XHJcbiAgICAgICAgbGV0IG5lc3RlZFAgPSAwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspe1xyXG4gICAgICAgICAgICBpZiAoIXNraXAgJiYgdmFsdWVbaV0gPT09ICcgJyAmJiBsYXN0ID09PSAnICcpe1xyXG4gICAgICAgICAgICAgICAgc3RhcnQgPSBpICsgMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICghc2tpcCAmJiB2YWx1ZVtpXSA9PT0gJyAnKSB7XHJcbiAgICAgICAgICAgICAgICBydmFsdWUucHVzaCh2YWx1ZS5zdWJzdHJpbmcoc3RhcnQsIGkpKTtcclxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gaTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZVtpXSA9PT0gJygnKSB7XHJcbiAgICAgICAgICAgICAgICBuZXN0ZWRQKys7XHJcbiAgICAgICAgICAgICAgICBza2lwID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZVtpXSA9PT0gJyknKSB7XHJcbiAgICAgICAgICAgICAgICBuZXN0ZWRQLS07XHJcbiAgICAgICAgICAgICAgICBpZiAobmVzdGVkUCA9PT0gMCkgc2tpcCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxhc3QgPSB2YWx1ZVtpXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcnZhbHVlLnB1c2godmFsdWUuc3Vic3RyaW5nKHN0YXJ0LCB2YWx1ZS5sZW5ndGgpKTtcclxuICAgICAgICByZXR1cm4gcnZhbHVlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0b1N0cmluZygpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuc3R5bGUudHJhbnNmb3JtO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybWVyOyIsIlwidXNlIHN0cmljdFwiO1xyXG5jb25zdCBOaWRnZXRFbGVtZW50ID0gcmVxdWlyZShcIi4uL05pZGdldEVsZW1lbnRcIik7XHJcblxyXG4vKipcclxuICogQSBOaWRnZXQgdGhhdCBjaGFuZ2VzIHRoZSBpbWFnZSBmb3IgaG92ZXIsIGRpc2FibGVkLCBwcmVzcywgYW5kIGlkbGUuXHJcbiAqIEZpcmVzIGEgY2xpY2sgZXZlbnQgd2hlbiBjbGlja2VkLlxyXG4gKlxyXG4gKiBXaWxsIHNldCB0aGUgY3VycmVudCBzdGF0ZSBhcyBkYXRhLXN0YXRlIHNvIHRoYXQgY3NzIGNhbiBhY2Nlc3MgaXQuXHJcbiAqL1xyXG5jbGFzcyBOaWRnZXRCdXR0b24gZXh0ZW5kcyBOaWRnZXRFbGVtZW50IHtcclxuXHJcbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xyXG4gICAgICAgIHRoaXMuYWxwaGFUb2xlcmFuY2UgPSAwOyAvLyBhbHBoYSBuZWVkcyB0byBiZSA+IHRvbGVyYW5jZSB0byB0cmlnZ2VyIGV2ZW50cy5cclxuXHJcbiAgICAgICAgdGhpcy5zdHJpbmdIb3ZlciA9IFwibmlkZ2V0LWJ1dHRvbi1zdGF0ZVtzdGF0ZT0nSE9WRVInXVwiO1xyXG4gICAgICAgIHRoaXMuc3RyaW5nRGlzYWJsZWQgPSBcIm5pZGdldC1idXR0b24tc3RhdGVbc3RhdGU9J0RJU0FCTEVEJ11cIjtcclxuICAgICAgICB0aGlzLnN0cmluZ1ByZXNzID0gXCJuaWRnZXQtYnV0dG9uLXN0YXRlW3N0YXRlPSdQUkVTUyddXCI7XHJcbiAgICAgICAgdGhpcy5zdHJpbmdJZGxlID0gXCJuaWRnZXQtYnV0dG9uLXN0YXRlW3N0YXRlPSdJRExFJ11cIjtcclxuXHJcbiAgICAgICAgdGhpcy5zdGF0ZSA9IFwiaWRsZVwiO1xyXG4gICAgfVxyXG5cclxuICAgIGlzSW5TZXQoKSB7XHJcbiAgICAgICAgbGV0IHBhcmVudCA9IHRoaXMucGFyZW50Tm9kZTtcclxuICAgICAgICB3aGlsZSAocGFyZW50ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudC50YWdOYW1lID09PSBcIk5JREdFVC1CVVRUT04tU0VUXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgbmlkZ2V0UmVhZHkoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmVOaWRnZXQgPSB0aGlzLnN0cmluZ0Rpc2FibGVkO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlTmlkZ2V0ID0gdGhpcy5zdHJpbmdJZGxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNJblNldCgpKSByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZW50ZXJcIiwgdGhpcy5tb3VzZUVudGVyKTtcclxuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWxlYXZlXCIsIHRoaXMubW91c2VMZWF2ZSk7XHJcbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHRoaXMubW91c2VQcmVzcyk7XHJcbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCB0aGlzLm1vdXNlUmVsZWFzZSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlZCkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBpc1VuZGVyKGV2ZW50KSB7XHJcbiAgICAgICAgbGV0IGVsZW1lbnRzID0gZG9jdW1lbnQuZWxlbWVudHNGcm9tUG9pbnQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSk7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRzLmluZGV4T2YodGhpcy5hY3RpdmVOaWRnZXQpID09IC0xKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGxldCByZWN0ID0gdGhpcy5hY3RpdmVOaWRnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgbGV0IHggPSBldmVudC5jbGllbnRYIC0gcmVjdC54O1xyXG4gICAgICAgIGxldCB5ID0gZXZlbnQuY2xpZW50WSAtIHJlY3QueTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGVzdEFscGhhKHgsIHkpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBkaXNhYmxlZCgpIHtcclxuICAgICAgICByZXR1cm4gc3VwZXIuZGlzYWJsZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IGRpc2FibGVkKHZhbHVlKSB7XHJcbiAgICAgICAgc3VwZXIuZGlzYWJsZWQgPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgaWYgKHZhbHVlID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlTmlkZ2V0ID0gdGhpcy5zdHJpbmdEaXNhYmxlZDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHRoaXMuc3RhdGUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJpblwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlTmlkZ2V0ID0gdGhpcy5zdHJpbmdIb3ZlcjtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJwcmVzc1wiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlTmlkZ2V0ID0gdGhpcy5zdHJpbmdQcmVzcztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVOaWRnZXQgPSB0aGlzLnN0cmluZ0lkbGU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbW91c2VSZWxlYXNlKGUpIHtcclxuICAgICAgICB0aGlzLnN0YXRlID0gXCJob3ZlclwiO1xyXG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5hY3RpdmVOaWRnZXQgPSB0aGlzLnN0cmluZ0hvdmVyO1xyXG4gICAgfVxyXG5cclxuICAgIG1vdXNlUHJlc3MoZSkge1xyXG4gICAgICAgIHRoaXMuc3RhdGUgPSBcInByZXNzXCI7XHJcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZWQpIHJldHVybjtcclxuICAgICAgICB0aGlzLmFjdGl2ZU5pZGdldCA9IHRoaXMuc3RyaW5nUHJlc3M7XHJcbiAgICB9XHJcblxyXG4gICAgaGlkZUFsbEltYWdlcygpIHtcclxuICAgICAgICB0aGlzLnF1ZXJ5U2VsZWN0b3IodGhpcy5zdHJpbmdIb3ZlcikuaGlkZSgpO1xyXG4gICAgICAgIHRoaXMucXVlcnlTZWxlY3Rvcih0aGlzLnN0cmluZ0Rpc2FibGVkKS5oaWRlKCk7XHJcbiAgICAgICAgdGhpcy5xdWVyeVNlbGVjdG9yKHRoaXMuc3RyaW5nUHJlc3MpLmhpZGUoKTtcclxuICAgICAgICB0aGlzLnF1ZXJ5U2VsZWN0b3IodGhpcy5zdHJpbmdJZGxlKS5oaWRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IGFjdGl2ZU5pZGdldChzZWxlY3Rvcikge1xyXG4gICAgICAgIHRoaXMuaGlkZUFsbEltYWdlcygpO1xyXG4gICAgICAgIHRoaXMuX2FjdGl2ZU5pZGdldCA9IHRoaXMucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcbiAgICAgICAgdGhpcy5fYWN0aXZlTmlkZ2V0LnNob3coKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgYWN0aXZlTmlkZ2V0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVOaWRnZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IHN0YXRlKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJkYXRhLXN0YXRlXCIsIHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgc3RhdGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKFwiZGF0YS1zdGF0ZVwiKTtcclxuICAgIH1cclxuXHJcbiAgICB0ZXN0QWxwaGEoeCwgeSkge1xyXG4gICAgICAgIGxldCBwaXhlbCA9IHRoaXMuYWN0aXZlTmlkZ2V0LmdldFBpeGVsKHgsIHkpO1xyXG4gICAgICAgIHJldHVybiBwaXhlbFszXSA+IHRoaXMuYWxwaGFUb2xlcmFuY2U7XHJcbiAgICB9XHJcblxyXG4gICAgbW91c2VMZWF2ZSgpIHtcclxuICAgICAgICB0aGlzLnN0YXRlID0gXCJvdXRcIjtcclxuICAgICAgICBpZiAodGhpcy5kaXNhYmxlZCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuYWN0aXZlTmlkZ2V0ID0gdGhpcy5zdHJpbmdJZGxlO1xyXG4gICAgfVxyXG5cclxuICAgIG1vdXNlQWN0aXZlKCkge1xyXG4gICAgICAgIHRoaXMuc3RhdGUgPSBcImhvdmVyXCI7XHJcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZWQpIHJldHVybjtcclxuICAgICAgICB0aGlzLmFjdGl2ZU5pZGdldCA9IHRoaXMuc3RyaW5nSG92ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgbW91c2VNb3ZlKGUpIHtcclxuICAgICAgICBpZiAoIXRoaXMudGVzdEFscGhhKGUuY2xpZW50WCwgZS5jbGllbnRZKSkge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gXCJvdXRcIjtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZGlzYWJsZWQpIHJldHVybjtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmVOaWRnZXQgPSB0aGlzLnN0cmluZ0lkbGU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFwiaG92ZXJcIjtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZGlzYWJsZWQpIHJldHVybjtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmVOaWRnZXQgPSB0aGlzLnN0cmluZ0hvdmVyO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG47XHJcblxyXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCduaWRnZXQtYnV0dG9uJywgTmlkZ2V0QnV0dG9uKTtcclxubW9kdWxlLmV4cG9ydHMgPSBOaWRnZXRCdXR0b247XHJcblxyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuY29uc3QgTmlkZ2V0RWxlbWVudCA9IHJlcXVpcmUoXCIuLi9OaWRnZXRFbGVtZW50XCIpO1xyXG5cclxuY2xhc3MgTmlkZ2V0QnV0dG9uU2V0IGV4dGVuZHMgTmlkZ2V0RWxlbWVudCB7XHJcbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xyXG4gICAgICAgIHRoaXMuYWxwaGFUb2xlcmFuY2UgPSAwOyAvLyBhbHBoYSBuZWVkcyB0byBiZSA+IHRvbGVyYW5jZSB0byB0cmlnZ2VyIGV2ZW50cy5cclxuXHJcbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHRoaXMubW91c2VQcmVzcyk7XHJcbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCB0aGlzLm1vdXNlUmVsZWFzZSk7XHJcbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMubW91c2VNb3ZlKTtcclxuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWxlYXZlXCIsIHRoaXMubW91c2VMZWF2ZSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlZCkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIG5pZGdldFJlYWR5KCl7XHJcbiAgICAgICAgdGhpcy5idXR0b25zID0gdGhpcy5xdWVyeVNlbGVjdG9yQWxsKFwibmlkZ2V0LWJ1dHRvblwiKTtcclxuICAgIH1cclxuXHJcbiAgICBtb3VzZVByZXNzKGUpe1xyXG4gICAgICAgIGZvciAobGV0IGVsZW1lbnQgb2YgdGhpcy5idXR0b25zKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50LmlzVW5kZXIoZSkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQubW91c2VQcmVzcygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFwicHJlc3NcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtb3VzZVJlbGVhc2UoZSl7XHJcbiAgICAgICAgdGhpcy5zdGF0ZSA9IFwib3V0XCI7XHJcbiAgICAgICAgZm9yIChsZXQgZWxlbWVudCBvZiB0aGlzLmJ1dHRvbnMpIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1lbnQuaXNVbmRlcihlKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuc3RhdGUgPT0gXCJwcmVzc1wiKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwiYnV0dG9uLWNsaWNrZWRcIiwge2RldGFpbDogZWxlbWVudH0pKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsZW1lbnQubW91c2VSZWxlYXNlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gXCJob3ZlclwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1vdXNlTW92ZShlKXtcclxuICAgICAgICB0aGlzLnN0YXRlID0gXCJvdXRcIjtcclxuICAgICAgICBmb3IgKGxldCBlbGVtZW50IG9mIHRoaXMuYnV0dG9ucyl7XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50LmlzVW5kZXIoZSkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQubW91c2VBY3RpdmUoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBcImhvdmVyXCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50Lm1vdXNlTGVhdmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtb3VzZUxlYXZlKGUpe1xyXG4gICAgICAgIGZvciAobGV0IGVsZW1lbnQgb2YgdGhpcy5idXR0b25zKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQubW91c2VMZWF2ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gXCJvdXRcIjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IHN0YXRlKHZhbHVlKXtcclxuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImRhdGEtc3RhdGVcIiwgdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBzdGF0ZSgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZShcImRhdGEtc3RhdGVcIik7XHJcbiAgICB9XHJcbn1cclxuXHJcbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ25pZGdldC1idXR0b24tc2V0JywgTmlkZ2V0QnV0dG9uU2V0KTtcclxubW9kdWxlLmV4cG9ydHMgPSBOaWRnZXRCdXR0b25TZXQ7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbmNvbnN0IE5pZGdldCA9IHJlcXVpcmUoXCIuLi9OaWRnZXRFbGVtZW50XCIpO1xyXG5cclxuLyoqXHJcbiAqIEEgTmlkZ2V0IHRoYXQgY2hhbmdlcyB0aGUgaW1hZ2UgZm9yIGhvdmVyLCBkaXNhYmxlZCwgcHJlc3MsIGFuZCBpZGxlLlxyXG4gKiBGaXJlcyBhIGNsaWNrIGV2ZW50IHdoZW4gY2xpY2tlZC5cclxuICogXHJcbiAqIFRoaXMgaXMgdGhlIGh0bWwgZWxlbWVudCBcIm5pZGdldC1idXR0b25cIi5cclxuICogSWYgdGhlIG5pZGdldC1idXR0b24gaGFzIHRoZSBhdHRyaWJ1dGUgYGltZy1wcmVmaXggPSBcInByZWZpeFwiYCB0aGVuIHRoZSBcclxuICogZm9sbG93aW5nIGltYWdlcy4gIGBpbWctc3VmZml4YCA9IFwic3VmZml4XCIgd2lsbCBvdmVycmlkZSB0aGUgXCIucG5nXCIuXHJcbiAqIHdpbGwgYmUgdXNlZDpcclxuICogLSBwcmVmaXgtaG92ZXIucG5nXHJcbiAqIC0gcHJlZml4LWRpc2FibGVkLnBuZ1xyXG4gKiAtIHByZWZpeC1wcmVzcy5wbmdcclxuICogLSBwcmVmaXgtaWRsZS5wbmdcclxuICovXHJcbmNsYXNzIE5pZGdldEJ1dHRvblN0YXRlIGV4dGVuZHMgTmlkZ2V0IHtcclxuXHJcbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xyXG4gICAgfVxyXG5cclxuICAgIG5pZGdldFJlYWR5KCl7XHJcbiAgICAgICAgdGhpcy5pbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xyXG4gICAgICAgIHRoaXMuaW1nLnNldEF0dHJpYnV0ZShcInNyY1wiLCB0aGlzLmdldEF0dHJpYnV0ZShcImltYWdlLXNyY1wiKSk7XHJcbiAgICAgICAgdGhpcy5hcHBlbmQodGhpcy5pbWcpO1xyXG4gICAgfVxyXG5cclxuICAgIHNob3coKXtcclxuICAgICAgICBzdXBlci5zaG93KCk7XHJcbiAgICAgICAgdGhpcy5sb2FkQ2FudmFzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgbG9hZENhbnZhcygpe1xyXG4gICAgICAgIGlmICghdGhpcy5pbWcgfHwgdGhpcy5jYW52YXMpIHJldHVybjtcclxuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5pbWcubmF0dXJhbFdpZHRoO1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuaW1nLm5hdHVyYWxIZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDApO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNhbnZhcztcclxuICAgIH1cclxuXHJcbiAgICBnZXRQaXhlbCh4LCB5KXtcclxuICAgICAgICB0aGlzLmxvYWRDYW52YXMoKTtcclxuICAgICAgICBsZXQgZHggPSB0aGlzLmNhbnZhcy53aWR0aCAvIHRoaXMub2Zmc2V0V2lkdGg7XHJcbiAgICAgICAgbGV0IGR5ID0gdGhpcy5jYW52YXMuaGVpZ2h0IC8gdGhpcy5vZmZzZXRIZWlnaHQ7XHJcbiAgICAgICAgbGV0IHBpeGVsID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5nZXRJbWFnZURhdGEoZHggKiB4LCBkeSAqIHksIDEsIDEpLmRhdGE7XHJcbiAgICAgICAgcmV0dXJuIHBpeGVsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IHN0YXRlIHRvIEhPVkVSLCBESVNBQkxFRCwgUFJFU1MsIElETEUuXHJcbiAgICAgKiBAcGFyYW0ge3R5cGV9IHN0YXRlXHJcbiAgICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XHJcbiAgICAgKi9cclxuICAgIHNldCBzdGF0ZShzdGF0ZSkge1xyXG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwic3RhdGVcIiwgc3RhdGUudG9VcHBlckNhc2UoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHN0YXRlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNldEF0dHJpYnV0ZShcInN0YXRlXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCBzb3VyY2UoaW1nKSB7XHJcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgaW1nKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgc291cmNlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNldEF0dHJpYnV0ZShcInNyY1wiKTtcclxuICAgIH1cclxufVxyXG47XHJcblxyXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCduaWRnZXQtYnV0dG9uLXN0YXRlJywgTmlkZ2V0QnV0dG9uU3RhdGUpO1xyXG5tb2R1bGUuZXhwb3J0cyA9IE5pZGdldEJ1dHRvblN0YXRlO1xyXG5cclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbmNvbnN0IE5pZGdldEVsZW1lbnQgPSByZXF1aXJlKFwiLi4vTmlkZ2V0RWxlbWVudFwiKTtcclxuXHJcbi8qKlxyXG4gKiBBIGNvbXBvbmVudCB0aGF0IGhhcyBldmVudHMgZm9yIGFkZGluZyBuaWRnZXRzLCByZW1vdmluZyBuaWRnZXRzLCBhbmQgXHJcbiAqIHJlc2l6aW5nIHRoZSBjb250YWluZXIuICBXaGVuIHRoZSBjb250YWluZXIgc2l6ZSBpcyBjaGFuZ2VkLCB0aGUgbnVtYmVyXHJcbiAqIG9mIGNvbXBvbmVudHMgY2hhbmdlLCBvciB0aGUgbGF5b3V0IGF0dHJpYnV0ZSBjaGFuZ2VzLCB0aGUgZG9MYXlvdXQgZnVuY3Rpb25cclxuICogaXMgY2FsbGVkLlxyXG4gKiBcclxuICogVGhlIGNvbXBvbmVudHMgYXJlIGFycmFnZWQgYWNjb3JkaW5nIHRvIHRoZSBzZWxlY3RlZCBsYXlvdXQgYXR0cmlidXRlLiAgSWYgXHJcbiAqIG5vIGxheW91dCBhdHRyaWJ1dGUgaXMgY2hvc2VuLCBkb0xheW91dCBpcyBzdGlsbCBjYWxsZWQgYXMgaXQgaXMgYXNzdW1lZCBcclxuICogYSBjdXN0b20gZnVuY3Rpb24gaGFzIGJlZW4gcHJvdmlkZWQuXHJcbiAqL1xyXG5cclxuY2xhc3MgTmlkZ2V0Q29udGFpbmVyIGV4dGVuZHMgTmlkZ2V0RWxlbWVudCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xyXG4gICAgICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XHJcbiAgICAgICAgbGV0IHJlc2l6ZU9ic2VydmVyID0gbmV3IFJlc2l6ZU9ic2VydmVyKHRoaXMuZG9MYXlvdXQpO1xyXG4gICAgICAgIHJlc2l6ZU9ic2VydmVyLm9ic2VydmUodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIFtOaWRnZXRDb250YWluZXIubGF5b3V0QXR0cmlidXRlXTtcclxuICAgIH1cclxuXHJcbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgaWYgKG9sZFZhbHVlID09PSBuZXdWYWx1ZSkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuZG9MYXlvdXQoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgbGF5b3V0KHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoTmlkZ2V0Q29udGFpbmVyLmxheW91dEF0dHJpYnV0ZSwgdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBsYXlvdXQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKE5pZGdldENvbnRhaW5lci5sYXlvdXRBdHRyaWJ1dGUpO1xyXG4gICAgfSAgICAgIFxyXG5cclxuICAgIGRvTGF5b3V0KCkge1xyXG4gICAgICAgIGlmICghdGhpcy5sYXlvdXQpIHJldHVybjtcclxuICAgICAgICBpZiAoIUxheW91dHNbdGhpcy5sYXlvdXRdKSB0aHJvdyBgaW52YWxpZCBsYXlvdXQ6ICR7dGhpcy5sYXlvdXR9YDtcclxuICAgICAgICBMYXlvdXRzW3RoaXMubGF5b3V0XTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgTGF5b3V0cyB7XHJcbiAgICAvKipcclxuICAgICAqIEZpdCBhbGwgbmlkZ2V0cyBldmVubHkgaW4gYSBob3Jpem9udGFsIHJvdy5cclxuICAgICAqIEBwYXJhbSB7dHlwZX0gbmlkZ2V0XHJcbiAgICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyByb3cobmlkZ2V0KSB7XHJcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5zaXplKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbk5pZGdldENvbnRhaW5lci5sYXlvdXRBdHRyaWJ1dGUgPSBcImxheW91dFwiO1xyXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCduaWRnZXQtY29udGFpbmVyJywgTmlkZ2V0Q29udGFpbmVyKTtcclxubW9kdWxlLmV4cG9ydHMgPSBOaWRnZXRDb250YWluZXI7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbmNvbnN0IE5pZGdldCA9IHJlcXVpcmUoXCIuLi9OaWRnZXRcIik7XHJcbmNvbnN0IFRyYW5zZm9ybWVyID0gcmVxdWlyZShcIi4uL1RyYW5zZm9ybWVyXCIpO1xyXG5cclxuLyoqXHJcbiAqIERvbid0IGZvcmdldCB0byBzZXQgJ2lzJyB3aGVuIHB1dHRpbmcgZWxlbWVudCBkaXJlY3RseSBpbiBodG1sIGFzIG9wcG9zZWQgdG9cclxuICogcHJvZ3JhbWljYWxseS5cclxuICogPGltZyBpcz1cInJlZ2lzdGVyZWQtbmFtZVwiIHNyYz1cImltYWdlLnBuZ1wiPjwvaW1nPlxyXG4gKiBcclxuICogaW5jbHVkZSBhIGN1c3RvbSBlbGVtZW50IGRlZmluaXRpb24gYXQgdGhlIGVuZCBvZiB0aGUgY2xhc3MuPGJyPlxyXG4gKiB3aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCdyZWdpc3RlcmVkLW5hbWUnLCBDbGFzcywge2V4dGVuZHM6IFwiaW1nXCJ9KTtcclxuICovXHJcbmNsYXNzIE5pZGdldEhUTUxJbWFnZSBleHRlbmRzIEhUTUxJbWFnZUVsZW1lbnQge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmxhc3REaXNwbGF5ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIHRoaXMudHJhbnNmb3JtZXIgPSBuZXcgVHJhbnNmb3JtZXIodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgc2NhbGUoZHcsIGRoKSB7XHJcbiAgICAgICAgaWYgKCFkaCkgZGggPSBkdztcclxuICAgICAgICBsZXQgdyA9IHRoaXMud2lkdGggKiBkdztcclxuICAgICAgICBsZXQgaCA9IHRoaXMuaGVpZ2h0ICogZGg7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHc7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoO1xyXG4gICAgfSAgICAgICAgXHJcblxyXG4gICAgc2V0IHNyYyh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwic3JjXCIsIHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgc3JjKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZShcInNyY1wiKTtcclxuICAgIH1cclxuXHJcbiAgICBsb2NhdGUobGVmdCwgdG9wKSB7XHJcbiAgICAgICAgdGhpcy5sZWZ0ID0gbGVmdDtcclxuICAgICAgICB0aGlzLnRvcCA9IHRvcDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbGVmdCgpIHtcclxuICAgICAgICBsZXQgdyA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRoaXMpLmxlZnQ7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodyk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHRvcCgpIHtcclxuICAgICAgICBsZXQgaCA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRoaXMpLnRvcDtcclxuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgbGVmdCh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuc3R5bGUubGVmdCA9IHZhbHVlICsgXCJweFwiO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCB0b3AodmFsdWUpIHtcclxuICAgICAgICB0aGlzLnN0eWxlLnRvcCA9IHZhbHVlICsgXCJweFwiO1xyXG4gICAgfSAgICBcclxuXHJcbiAgICBzZXQgd2lkdGgodykge1xyXG4gICAgICAgIHRoaXMuc3R5bGUud2lkdGggPSB3ICsgXCJweFwiO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCBoZWlnaHQodykge1xyXG4gICAgICAgIHRoaXMuc3R5bGUuaGVpZ2h0ID0gdyArIFwicHhcIjtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgd2lkdGgoKSB7XHJcbiAgICAgICAgbGV0IHcgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzKS53aWR0aDtcclxuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh3KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgaGVpZ2h0KCkge1xyXG4gICAgICAgIGxldCBoID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcykuaGVpZ2h0O1xyXG4gICAgICAgIHJldHVybiBwYXJzZUZsb2F0KGgpO1xyXG4gICAgfSAgICAgICAgXHJcblxyXG4gICAgc2hvdygpIHtcclxuICAgICAgICBpZiAodGhpcy5sYXN0RGlzcGxheSkge1xyXG4gICAgICAgICAgICB0aGlzLnN0eWxlLmRpc3BsYXkgPSB0aGlzLmxhc3REaXNwbGF5O1xyXG4gICAgICAgICAgICB0aGlzLmxhc3REaXNwbGF5ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3R5bGUuZGlzcGxheSA9IFwiaW5saW5lLWJsb2NrXCI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGhpZGUoKSB7XHJcbiAgICAgICAgdGhpcy5sYXN0RGlzcGxheSA9IHRoaXMuc3R5bGUuZGlzcGxheTtcclxuICAgICAgICB0aGlzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgZGlzcGxheSh2YWx1ZSl7XHJcbiAgICAgICAgdGhpcy5zdHlsZS5kaXNwbGF5ID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGdldCBkaXNwbGF5KCl7XHJcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5jYWxjdWxhdGVTdHlsZSh0aGlzKVtcImRpc3BsYXlcIl07XHJcbiAgICB9XHJcblxyXG4gICAgZGV0YWNoKCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcih0aGlzKTtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgc2V0IGRpc2FibGVkKHZhbHVlKXtcclxuICAgICAgICBpZiAodmFsdWUgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJkaXNhYmxlZFwiLCB0cnVlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShcImRpc2FibGVkXCIsIGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGdldCBkaXNhYmxlZCgpe1xyXG4gICAgICAgIGlmICghdGhpcy5oYXNBdHRyaWJ1dGUoXCJkaXNhYmxlZFwiKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZShcImRpc2FibGVkXCIpO1xyXG4gICAgfSAgICBcclxuICAgIFxyXG4gICAgY2xlYXJQb3MoKXtcclxuICAgICAgICB0aGlzLnN0eWxlLnRvcCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5zdHlsZS5sZWZ0ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhckRpbXMoKXtcclxuICAgICAgICB0aGlzLnN0eWxlLndpZHRoID0gbnVsbDtcclxuICAgICAgICB0aGlzLnN0eWxlLmhlaWdodCA9IG51bGw7XHJcbiAgICB9ICAgIFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE5pZGdldEhUTUxJbWFnZTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbmNvbnN0IE5pZGdldEVsZW1lbnQgPSByZXF1aXJlKFwiLi4vTmlkZ2V0RWxlbWVudFwiKTtcclxuXHJcbi8qKlxyXG4gKiBBIE5pZGdldCB0aGF0IGNvbnRhaW5zIGltYWdlcy5cclxuICovXHJcbmNsYXNzIE5pZGdldEltYWdlIGV4dGVuZHMgTmlkZ2V0RWxlbWVudCB7XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc3JjKXtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcclxuICAgICAgICBpZiAoc3JjKSB0aGlzLnNyYyA9IHNyYztcclxuICAgIH1cclxuXHJcbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpe1xyXG4gICAgICAgIGxldCBzcmMgPSB0aGlzLmdldEF0dHJpYnV0ZShOaWRnZXRJbWFnZS5zcmNBdHRyaWJ1dGUpOyAgICAgICAgXHJcbiAgICAgICAgaWYgKHNyYykgdGhpcy5pbWcuc2V0QXR0cmlidXRlKFwic3JjXCIsIHNyYyk7ICAgICAgIFxyXG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5pbWcpO1xyXG4gICAgICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHNyYygpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmltZy5nZXRBdHRyaWJ1dGUoXCJzcmNcIik7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IHNyYyh2YWx1ZSl7XHJcbiAgICAgICAgdGhpcy5pbWcuc2V0QXR0cmlidXRlKFwic3JjXCIsIHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBzaXplKHdpZHRoLCBoZWlnaHQpe1xyXG4gICAgICAgIHRoaXMuc3R5bGUud2lkdGggPSB3aWR0aFxyXG4gICAgICAgIHRoaXMuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0XHJcbiAgICAgICAgdGhpcy5pbWcuc3R5bGUud2lkdGggPSB3aWR0aFxyXG4gICAgICAgIHRoaXMuaW1nLnN0eWxlLmhlaWdodCA9IGhlaWdodFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBzY2FsZShkdywgZGgpe1xyXG4gICAgICAgIGlmICghZGgpIGRoID0gZHc7XHJcbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy5vZmZzZXRXaWR0aCAqIGR3O1xyXG4gICAgICAgIGxldCBoZWlnaHQgPSB0aGlzLm9mZnNldEhlaWdodCAqIGRoO1xyXG4gICAgICAgIHRoaXMuc2l6ZShgJHt3aWR0aH1weGAsIGAke2hlaWdodH1weGApO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBzaG93KCl7XHJcbiAgICAgICAgaWYgKHRoaXMuc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIpe1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5zdHlsZS5kaXNwbGF5O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgaGlkZSgpe1xyXG4gICAgICAgIHRoaXMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgfVxyXG59XHJcblxyXG5OaWRnZXRJbWFnZS5zcmNBdHRyaWJ1dGUgPSBcInNyY1wiO1xyXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCduaWRnZXQtaW1hZ2UnLCBOaWRnZXRJbWFnZSk7XHJcbm1vZHVsZS5leHBvcnRzID0gTmlkZ2V0SW1hZ2U7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbmNvbnN0IE5pZGdldEVsZW1lbnQgPSByZXF1aXJlKFwiLi4vTmlkZ2V0RWxlbWVudFwiKTtcclxuXHJcbi8qKlxyXG4gKiBXaGVuIHVzaW5nIC0tbmlkZ2V0LWZpdC10ZXh0LCBkbyBub3QgaW5jbHVkZSBoZWlnaHQgYW5kIHdpZHRoIGF0dHJpYnV0ZXMuXHJcbiAqIEEgZm9udCBzaXplIGNhbiBiZSB1c2VkIGFzIGEgc3RhcnRpbmcgcG9pbnQuXHJcbiAqL1xyXG5jbGFzcyBGaXRUZXh0IHtcclxuICAgIGNvbnN0cnVjdG9yKG5pZGdldCl7XHJcbiAgICAgICAgdGhpcy5uaWRnZXQgPSBuaWRnZXQ7XHJcbiAgICAgICAgdGhpcy5sb2NrID0gXCJub25lXCI7XHJcbiAgICAgICAgdGhpcy5wYXJzZUFyZ3VtZW50cygpO1xyXG4gICAgfVxyXG5cclxuICAgIGxpc3Rlbigpe1xyXG4gICAgICAgIHRoaXMub2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoKCk9PnRoaXMuZGVsYXlSZXNpemUodGhpcy5oVmFsdWUsIHRoaXMud1ZhbHVlKSk7XHJcbiAgICAgICAgdGhpcy5vYnNlcnZlci5vYnNlcnZlKHRoaXMubmlkZ2V0LnBhcmVudEVsZW1lbnQpO1xyXG4gICAgICAgIHRoaXMuZGlyZWN0aW9uID0gMDtcclxuICAgICAgICB0aGlzLmRlbGF5ID0gMjU7XHJcbiAgICAgICAgdGhpcy5kZWxheVJlc2l6ZSh0aGlzLmhWYWx1ZSwgdGhpcy53VmFsdWUpO1xyXG4gICAgICAgIHRoaXMuc3RvcCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGRlbGF5UmVzaXplKGhWYWx1ZSwgd1ZhbHVlKXtcclxuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IDA7XHJcbiAgICAgICAgaWYgKHRoaXMudGltZW91dCkgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XHJcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCgoKT0+dGhpcy5vblJlc2l6ZShoVmFsdWUsIHdWYWx1ZSksIHRoaXMuZGVsYXkpO1xyXG4gICAgfVxyXG5cclxuICAgIG5vdGlmeShoVmFsdWUsIHdWYWx1ZSl7XHJcbiAgICAgICAgdGhpcy5zdG9wID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5kZWxheVJlc2l6ZShoVmFsdWUsIHdWYWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2VBcmd1bWVudHMoKXtcclxuICAgICAgICBsZXQgYXJncyA9IGdldENvbXB1dGVkU3R5bGUodGhpcy5uaWRnZXQpLmdldFByb3BlcnR5VmFsdWUoXCItLW5pZGdldC1maXQtdGV4dFwiKTtcclxuXHJcbiAgICAgICAgaWYgKCFhcmdzIHx8IGFyZ3MgPT09IGZhbHNlIHx8IGFyZ3MgPT09IFwiZmFsc2VcIil7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaFZhbHVlID0gdGhpcy53VmFsdWUgPSB0cnVlO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mKGFyZ3MpID09IFwic3RyaW5nXCIpe1xyXG4gICAgICAgICAgICBsZXQgb2JqID0gSlNPTi5wYXJzZShhcmdzKTtcclxuICAgICAgICAgICAgaWYgKG9ialtcImZpdFwiXSAhPT0gdW5kZWZpbmVkICYmIG9ialtcImZpdFwiXSA9PT0gXCJ3aWR0aFwiKSB0aGlzLmhWYWx1ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAob2JqW1wiZml0XCJdICE9PSB1bmRlZmluZWQgJiYgb2JqW1wiZml0XCJdID09PSBcImhlaWdodFwiKSB0aGlzLndWYWx1ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAob2JqW1wibG9ja1wiXSAhPT0gdW5kZWZpbmVkKSB0aGlzLmxvY2sgPSAob2JqW1wibG9ja1wiXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG9uUmVzaXplKGhWYWx1ZSwgd1ZhbHVlKXtcclxuICAgICAgICBkZWxldGUgdGhpcy50aW1lb3V0O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zdG9wKSByZXR1cm47XHJcbiAgICAgICAgaWYgKHRoaXMubmlkZ2V0LnRleHRDb250ZW50ID09PSBcIlwiKSByZXR1cm47XHJcbiAgICAgICAgaWYgKHRoaXMubmlkZ2V0LnBhcmVudEVsZW1lbnQub2Zmc2V0SGVpZ2h0ID09PSAwKSByZXR1cm47XHJcbiAgICAgICAgaWYgKHRoaXMubmlkZ2V0LnBhcmVudEVsZW1lbnQub2Zmc2V0V2lkdGggPT09IDApIHJldHVybjtcclxuICAgICAgICBpZiAodGhpcy5uaWRnZXQuc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKCFoVmFsdWUgJiYgIXdWYWx1ZSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgaERpciA9IHRoaXMubmlkZ2V0LnBhcmVudEVsZW1lbnQub2Zmc2V0SGVpZ2h0IC0gdGhpcy5uaWRnZXQuc2Nyb2xsSGVpZ2h0O1xyXG4gICAgICAgIGxldCB3RGlyID0gdGhpcy5uaWRnZXQucGFyZW50RWxlbWVudC5vZmZzZXRXaWR0aCAtIHRoaXMubmlkZ2V0LnNjcm9sbFdpZHRoO1xyXG5cclxuICAgICAgICBpZiAoIWhWYWx1ZSkgaERpciA9IDA7XHJcbiAgICAgICAgaWYgKCF3VmFsdWUpIHdEaXIgPSAwO1xyXG5cclxuICAgICAgICBsZXQgZGlyID0gTWF0aC5zaWduKGhEaXIgfCB3RGlyKTsgLy8gd2lsbCBwcmVmZXIgdG8gc2hyaW5rXHJcbiAgICAgICAgaWYgKHRoaXMuZGlyZWN0aW9uID09PSAwKSB0aGlzLmRpcmVjdGlvbiA9IGRpcjsgLy8ga2VlcCBwcmV2aW91cyBkaXJlY3Rpb25cclxuXHJcbiAgICAgICAgbGV0IGZvbnRTaXplID0gcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLm5pZGdldClbXCJmb250LXNpemVcIl0pXHJcbiAgICAgICAgbGV0IG5ld1NpemUgPSBmb250U2l6ZSArICh0aGlzLmRpcmVjdGlvbik7XHJcblxyXG4gICAgICAgIGlmIChuZXdTaXplICE9PSBmb250U2l6ZSAmJiB0aGlzLmRpcmVjdGlvbiA9PT0gZGlyKSB7XHJcbiAgICAgICAgICAgIHRoaXMubmlkZ2V0LnN0eWxlLmZvbnRTaXplID0gbmV3U2l6ZSArIFwicHhcIjtcclxuICAgICAgICAgICAgaWYgKHRoaXMudGltZW91dCkgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XHJcbiAgICAgICAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoKCk9PnRoaXMub25SZXNpemUoaFZhbHVlLCB3VmFsdWUpLCB0aGlzLmRlbGF5KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRpciA8IDAgJiYgdGhpcy5kaXJlY3Rpb24gPiAwKSB7IC8vIHJldmVyc2UgZGlyZWN0aW9uIGlmIGdyb3dpbmcgdG9vIGxhcmdlXHJcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0aW9uID0gLTE7XHJcbiAgICAgICAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoKCk9PnRoaXMub25SZXNpemUoaFZhbHVlLCB3VmFsdWUpLCB0aGlzLmRlbGF5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5sb2NrID09PSBcInZoXCIpIHtcclxuICAgICAgICAgICAgICAgIGxldCBmb250UmF0aW8gPSBuZXdTaXplIC8gd2luZG93LmlubmVySGVpZ2h0ICogMTAwO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uaWRnZXQuc3R5bGUuZm9udFNpemUgPSBmb250UmF0aW8gKyBcInZoXCI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3AgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMubG9jayA9PT0gXCJ2d1wiKXtcclxuICAgICAgICAgICAgICAgIGxldCBmb250UmF0aW8gPSBuZXdTaXplIC8gd2luZG93LmlubmVyV2lkdGggKiAxMDA7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5pZGdldC5zdHlsZS5mb250U2l6ZSA9IGZvbnRSYXRpbyArIFwidndcIjtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RvcCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEEgbmlkZ2V0IGVsZW1lbnQgZm9yIGRpc3BsYXlpbmcgdGV4dC5cclxuICogcHV0ICctLW5pZGdldC1maXQtdGV4dDogMS4wOycgaW50byBjc3MgZm9yIHRoaXMgZWxlbWVudCB0byBlbmFibGUgc2NhbGluZy5cclxuICogc2VlOiBOaWRnZXRTdHlsZS5qc1xyXG4gKi9cclxuY2xhc3MgTmlkZ2V0VGV4dCBleHRlbmRzIE5pZGdldEVsZW1lbnQge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5vYnNlcnZlcnNbXCJmaXQtdGV4dC13aWR0aC10b2xlcmFuY2VcIl0gPSAwLjAyO1xyXG4gICAgICAgIHRoaXMuZml0VGV4dCA9IG5ldyBGaXRUZXh0KHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZSgpe1xyXG4gICAgICAgIGlmICh0aGlzLmZpdFRleHQpIHtcclxuICAgICAgICAgICAgdGhpcy5maXRUZXh0LnN0b3AgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmZpdFRleHQub2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdXBlci5yZW1vdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcclxuICAgICAgICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xyXG4gICAgICAgIGxldCBmaXRQcm9wID0gZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzKS5nZXRQcm9wZXJ0eVZhbHVlKFwiLS1uaWRnZXQtZml0LXRleHRcIik7XHJcblxyXG4gICAgICAgIGlmIChmaXRQcm9wICE9PSB1bmRlZmluZWQgJiYgZml0UHJvcCAhPT0gXCJcIil7XHJcbiAgICAgICAgICAgIHRoaXMuZml0VGV4dC5saXN0ZW4oKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IHRleHQodmFsdWUpe1xyXG4gICAgICAgIHRoaXMuaW5uZXJUZXh0ID0gdmFsdWU7XHJcbiAgICAgICAgaWYgKHRoaXMuZml0VGV4dCAmJiB0aGlzLmZpdFRleHQuc3RvcCA9PT0gZmFsc2Upe1xyXG4gICAgICAgICAgICB0aGlzLmZpdFRleHQuZGVsYXlSZXNpemUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHRleHQoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5pbm5lclRleHQ7XHJcbiAgICB9XHJcblxyXG4gICAgc2NhbGUoYW1vdW50KSB7XHJcbiAgICAgICAgbGV0IHN0eWxlRm9udFNpemUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLCBudWxsKS5nZXRQcm9wZXJ0eVZhbHVlKFwiZm9udC1zaXplXCIpO1xyXG4gICAgICAgIGxldCBmb250U2l6ZSA9IHBhcnNlRmxvYXQoc3R5bGVGb250U2l6ZSk7XHJcbiAgICAgICAgdGhpcy5zdHlsZS5mb250U2l6ZSA9IChmb250U2l6ZSAqIGFtb3VudCkgKyBcInB4XCI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgdGhlIGxpbmUgaGVpZ2h0IHRvIHRoZSBvZmZzZXQgaGVpZ2h0IG11bHRpcGxpZWQgYnkgcmF0aW8uXHJcbiAgICAgKiBDYWxsaW5nIHRoaXMgbWV0aG9kIGRpcmVjdG9yeSB3aWxsIG92ZXJyaWRlIHRoZSB2YWx1ZSBzZXQgYnkgY3NzXHJcbiAgICAgKi9cclxuICAgIG5pZGdldFZlcnRBbGlnblRleHQodmFsdWUpIHtcclxuICAgICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tbmlkZ2V0LXZlcnQtYWxpZ24tdGV4dFwiLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgb25SZXNpemUgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCByYXRpbyA9IGdldENvbXB1dGVkU3R5bGUodGhpcykuZ2V0UHJvcGVydHlWYWx1ZShcIi0tbmlkZ2V0LXZlcnQtYWxpZ24tdGV4dFwiKTtcclxuICAgICAgICAgICAgaWYgKCFwYXJzZUZsb2F0KHJhdGlvKSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBsZXQgaCA9IHRoaXMub2Zmc2V0SGVpZ2h0ICogcmF0aW87XHJcbiAgICAgICAgICAgIHRoaXMuc3R5bGUubGluZUhlaWdodCA9IGggKyBcInB4XCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vYnNlcnZlcnMudmVydEFsaWduVGV4dCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMub2JzZXJ2ZXJzLnZlcnRBbGlnblRleHQgPSBuZXcgUmVzaXplT2JzZXJ2ZXIob25SZXNpemUpO1xyXG4gICAgICAgICAgICB0aGlzLm9ic2VydmVycy52ZXJ0QWxpZ25UZXh0Lm9ic2VydmUodGhpcylcclxuICAgICAgICB9XHJcbiAgICAgICAgb25SZXNpemUoKVxyXG4gICAgfVxyXG5cclxuICAgIHZlcnRBbGlnblRleHQocmF0aW8gPSAxLjApe1xyXG4gICAgICAgIGlmICghcGFyc2VGbG9hdChyYXRpbykpIHJldHVybjtcclxuICAgICAgICBsZXQgaCA9IHRoaXMub2Zmc2V0SGVpZ2h0ICogcmF0aW87XHJcbiAgICAgICAgdGhpcy5zdHlsZS5saW5lSGVpZ2h0ID0gaCArIFwicHhcIjtcclxuICAgIH1cclxufVxyXG47XHJcblxyXG53aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCduaWRnZXQtdGV4dCcsIE5pZGdldFRleHQpO1xyXG5tb2R1bGUuZXhwb3J0cyA9IE5pZGdldFRleHQ7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbmNvbnN0IGRyYWdIYW5kbGVyID0gcmVxdWlyZShcIi4uL0RyYWdIYW5kbGVyXCIpLmluc3RhbmNlO1xyXG5cclxuXHJcbmZ1bmN0aW9uIG9uRHJhZ1N0YXJ0KGV2ZW50KXsgICAgXHJcbiAgICBkcmFnSGFuZGxlci5zZXQodGhpcyk7XHJcbiAgICB3aW5kb3cueCA9IHRoaXM7XHJcbiAgICBjb25zb2xlLmxvZyhcIidcIiArIHRoaXMubmFtZSgpICsgXCInXCIpO1xyXG4gICAgdGhpcy5ub3RpZnlMaXN0ZW5lcnMoXCJkcmFnU3RhcnRcIiArIHRoaXMubmFtZSgpLCBldmVudCwgdGhpcyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uRHJhZ0VuZChldmVudCl7XHJcbiAgICBpZiAoZHJhZ0hhbmRsZXIuZ2V0KCkgIT09IHRoaXMpIHJldHVybjtcclxuICAgIHRoaXMubm90aWZ5TGlzdGVuZXJzKFwiZHJhZ0VuZFwiICsgdGhpcy5uYW1lKCksIGV2ZW50LCB0aGlzKTtcclxuICAgIGRyYWdIYW5kbGVyLmNsZWFyKCk7XHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG5pZGdldCl7XHJcbiAgICBuaWRnZXQuZ2V0RWxlbWVudCgpLnNldEF0dHJpYnV0ZShcImRyYWdnYWJsZVwiLCBcInRydWVcIik7ICAgXHJcbiAgICBcclxuICAgIG5pZGdldC5vbkRyYWdTdGFydCA9IG9uRHJhZ1N0YXJ0LmJpbmQobmlkZ2V0KTtcclxuICAgIG5pZGdldC5vbkRyYWdFbmQgPSBvbkRyYWdFbmQuYmluZChuaWRnZXQpO1xyXG4gICAgXHJcbiAgICBuaWRnZXQuZ2V0RWxlbWVudCgpLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgbmlkZ2V0Lm9uRHJhZ1N0YXJ0KTtcclxuICAgIG5pZGdldC5nZXRFbGVtZW50KCkuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbmRcIiwgbmlkZ2V0Lm9uRHJhZ0VuZCk7ICAgIFxyXG59OyIsIlwidXNlIHN0cmljdFwiO1xyXG5jb25zdCBkcmFnSGFuZGxlciA9IHJlcXVpcmUoXCIuLi9EcmFnSGFuZGxlclwiKS5pbnN0YW5jZTtcclxuY29uc3QgTW91c2VVdGlsaXRpZXMgPSByZXF1aXJlKFwiLi4vTW91c2VVdGlsaXRpZXNcIik7XHJcblxyXG5mdW5jdGlvbiBvbkRyYWdPdmVyKGV2ZW50KXtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBsZXQgZHJhZ05pZGdldCA9IGRyYWdIYW5kbGVyLmdldCgpO1xyXG4gICAgdGhpcy5ub3RpZnlMaXN0ZW5lcnMoXCJkcmFnT3ZlclwiICsgdGhpcy5uYW1lKCksIGV2ZW50LCB0aGlzLCBkcmFnTmlkZ2V0KTtcclxufVxyXG5cclxuZnVuY3Rpb24gb25EcmFnRW50ZXIoZXZlbnQpe1xyXG4gICAgaWYgKCFkcmFnSGFuZGxlci5oYXMoKSkgcmV0dXJuO1xyXG4gICAgaWYgKCFkcmFnSGFuZGxlci5wdXNoT3Zlcih0aGlzKSkgcmV0dXJuO1xyXG4gICAgdGhpcy5ub3RpZnlMaXN0ZW5lcnMoXCJkcmFnRW50ZXJcIiArIHRoaXMubmFtZSgpLCBldmVudCwgdGhpcyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uRHJhZ0xlYXZlKGV2ZW50KXtcclxuICAgIGlmICghZHJhZ0hhbmRsZXIuaGFzKCkpIHJldHVybjtcclxuICAgIGlmIChNb3VzZVV0aWxpdGllcy5pc1VuZGVyKHRoaXMuZ2V0RWxlbWVudCgpKSkgcmV0dXJuO1xyXG4gICAgaWYgKCFkcmFnSGFuZGxlci5yZW1vdmVPdmVyKHRoaXMpKSByZXR1cm47XHJcbiAgICB0aGlzLm5vdGlmeUxpc3RlbmVycyhcImRyYWdMZWF2ZVwiICsgdGhpcy5uYW1lKCksIGV2ZW50LCB0aGlzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gb25Ecm9wKGV2ZW50KXtcclxuICAgIGxldCBkcmFnTmlkZ2V0ID0gZHJhZ0hhbmRsZXIuZ2V0KCk7XHJcbiAgICB0aGlzLm5vdGlmeUxpc3RlbmVycyhcImRyb3BcIiArIHRoaXMubmFtZSgpLCBldmVudCwgdGhpcywgZHJhZ05pZGdldCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obmlkZ2V0KXtcclxuICAgIG5pZGdldC5vbkRyYWdPdmVyID0gb25EcmFnT3Zlci5iaW5kKG5pZGdldCk7XHJcbiAgICBuaWRnZXQub25Ecm9wID0gb25Ecm9wLmJpbmQobmlkZ2V0KTtcclxuICAgIG5pZGdldC5vbkRyYWdFbnRlciA9IG9uRHJhZ0VudGVyLmJpbmQobmlkZ2V0KTtcclxuICAgIG5pZGdldC5vbkRyYWdMZWF2ZSA9IG9uRHJhZ0xlYXZlLmJpbmQobmlkZ2V0KTtcclxuICAgIFxyXG4gICAgbmlkZ2V0LmdldEVsZW1lbnQoKS5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgbmlkZ2V0Lm9uRHJhZ092ZXIpO1xyXG4gICAgbmlkZ2V0LmdldEVsZW1lbnQoKS5hZGRFdmVudExpc3RlbmVyKFwiZHJvcFwiLCBuaWRnZXQub25Ecm9wKTtcclxuICAgIG5pZGdldC5nZXRFbGVtZW50KCkuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbnRlclwiLCBuaWRnZXQub25EcmFnRW50ZXIpO1xyXG4gICAgbmlkZ2V0LmdldEVsZW1lbnQoKS5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsIG5pZGdldC5vbkRyYWdMZWF2ZSk7ICAgIFxyXG59OyIsIlwidXNlIHN0cmljdFwiO1xyXG5jb25zdCBNb3VzZVV0aWxpdGllcyA9IHJlcXVpcmUoXCIuLi9Nb3VzZVV0aWxpdGllc1wiKTtcclxuXHJcbmZ1bmN0aW9uIG9uQ2xpY2soZXZlbnQpeyAgICBcclxuICAgIHRoaXMubm90aWZ5TGlzdGVuZXJzKFwiY2xpY2tcIiArIHRoaXMubmFtZSgpLCBldmVudCwgdGhpcyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uTW91c2VEb3duKGV2ZW50KXsgICAgXHJcbiAgICB0aGlzLm5vdGlmeUxpc3RlbmVycyhcIm1vdXNlRG93blwiICsgdGhpcy5uYW1lKCksIGV2ZW50LCB0aGlzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gb25Nb3VzZVVwKGV2ZW50KXsgICAgXHJcbiAgICB0aGlzLm5vdGlmeUxpc3RlbmVycyhcIm1vdXNlVXBcIiArIHRoaXMubmFtZSgpLCBldmVudCwgdGhpcyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uTW91c2VFbnRlcihldmVudCl7ICAgIFxyXG4gICAgdGhpcy5ub3RpZnlMaXN0ZW5lcnMoXCJtb3VzZUVudGVyXCIgKyB0aGlzLm5hbWUoKSwgZXZlbnQsIHRoaXMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvbk1vdXNlTGVhdmUoZXZlbnQpe1xyXG4gICAgaWYgKE1vdXNlVXRpbGl0aWVzLmlzVW5kZXIodGhpcy5nZXRFbGVtZW50KCkpKSByZXR1cm47XHJcbiAgICB0aGlzLm5vdGlmeUxpc3RlbmVycyhcIm1vdXNlRXhpdFwiICsgdGhpcy5uYW1lKCksIGV2ZW50LCB0aGlzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihuaWRnZXQpe1xyXG4gICAgY29uc29sZS5sb2coXCJtb3VzZSBzZXR1cFwiKTtcclxuICAgIFxyXG4gICAgbmlkZ2V0Lm9uQ2xpY2sgPSBvbkNsaWNrLmJpbmQobmlkZ2V0KTtcclxuICAgIG5pZGdldC5vbk1vdXNlRG93biA9IG9uTW91c2VEb3duLmJpbmQobmlkZ2V0KTtcclxuICAgIG5pZGdldC5vbk1vdXNlVXAgPSBvbk1vdXNlVXAuYmluZChuaWRnZXQpO1xyXG4gICAgbmlkZ2V0Lm9uTW91c2VFbnRlciA9IG9uTW91c2VFbnRlci5iaW5kKG5pZGdldCk7XHJcbiAgICBuaWRnZXQub25Nb3VzZUxlYXZlID0gb25Nb3VzZUxlYXZlLmJpbmQobmlkZ2V0KTtcclxuICAgIFxyXG4gICAgbmlkZ2V0LmdldEVsZW1lbnQoKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgbmlkZ2V0Lm9uQ2xpY2spO1xyXG4gICAgbmlkZ2V0LmdldEVsZW1lbnQoKS5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIG5pZGdldC5vbk1vdXNlRG93bik7XHJcbiAgICBuaWRnZXQuZ2V0RWxlbWVudCgpLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIG5pZGdldC5vbk1vdXNlVXApO1xyXG4gICAgbmlkZ2V0LmdldEVsZW1lbnQoKS5hZGRFdmVudExpc3RlbmVyKFwibW91c2VlbnRlclwiLCBuaWRnZXQub25Nb3VzZUVudGVyKTtcclxuICAgIG5pZGdldC5nZXRFbGVtZW50KCkuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3V0XCIsIG5pZGdldC5vbk1vdXNlTGVhdmUpO1xyXG59O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbi8qKlxyXG4gKiBFbmFibGUgdGhlIG5pZGdldCB0byBiZSBtb3ZlZCBieSBkcmFnZ2luZy4gIFdpbGwgZHJhZyBieSBhbnkgY2hpbGQgZWxlZW1lbnRcclxuICogdGhlICcubmlkZ2V0LWhlYWRlcicgY2xhc3MsIG90aGVyd2lzZSBtb3ZhYmxlIGJ5IGNsaWNraW5nIGFueXdoZXJlLlxyXG4gKiBAcGFyYW0ge3R5cGV9IGVcclxuICogQHJldHVybiB7dW5kZWZpbmVkfVxyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIG9uTW91c2VNb3ZlKGUpeyAgICBcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIGlmICghdGhpcy5fX21vdmFibGUuYWN0aXZlKSByZXR1cm47ICAgIFxyXG5cclxuICAgIC8vIGNhbGN1bGF0ZSB0aGUgbmV3IGN1cnNvciBwb3NpdGlvbjpcclxuICAgIGxldCBkZWx0YVggPSB0aGlzLl9fbW92YWJsZS5sYXN0WCAtIGUuY2xpZW50WDtcclxuICAgIGxldCBkZWx0YVkgPSB0aGlzLl9fbW92YWJsZS5sYXN0WSAtIGUuY2xpZW50WTtcclxuICAgIHRoaXMuX19tb3ZhYmxlLmxhc3RYID0gZS5jbGllbnRYO1xyXG4gICAgdGhpcy5fX21vdmFibGUubGFzdFkgPSBlLmNsaWVudFk7XHJcbiAgICBcclxuICAgIC8vIHNldCB0aGUgZWxlbWVudCdzIG5ldyBwb3NpdGlvbjpcclxuICAgIHRoaXMuc3R5bGUudG9wID0gKHRoaXMub2Zmc2V0VG9wIC0gZGVsdGFZKSArIFwicHhcIjtcclxuICAgIHRoaXMuc3R5bGUubGVmdCA9ICh0aGlzLm9mZnNldExlZnQgLSBkZWx0YVgpICsgXCJweFwiO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvbk1vdXNlRG93bihlKXtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIHRoaXMuX19tb3ZhYmxlLmFjdGl2ZSA9IHRydWU7XHJcbiAgICBcclxuICAgIC8vIGdldCB0aGUgbW91c2UgY3Vyc29yIHBvc2l0aW9uIGF0IHN0YXJ0dXA6XHJcbiAgICB0aGlzLl9fbW92YWJsZS5sYXN0WCA9IGUuY2xpZW50WDtcclxuICAgIHRoaXMuX19tb3ZhYmxlLmxhc3RZID0gZS5jbGllbnRZO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvbk1vdXNlVXAoZSl7XHJcbiAgICB0aGlzLl9fbW92YWJsZS5hY3RpdmUgPSBmYWxzZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihuaWRnZXQpe1xyXG4gICAgbmlkZ2V0Ll9fbW92YWJsZSA9IHtcclxuICAgICAgICBsYXN0WCA6IDAsXHJcbiAgICAgICAgbGFzdFkgOiAwLFxyXG4gICAgICAgIGFjdGl2ZSA6IGZhbHNlXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBuaWRnZXQub25Nb3VzZURvd24gPSBvbk1vdXNlRG93bi5iaW5kKG5pZGdldCk7ICAgICAgICBcclxuICAgIFxyXG4gICAgaWYgKG5pZGdldC5xdWVyeVNlbGVjdG9yKFwiLm5pZGdldC1oZWFkZXJcIikpe1xyXG4gICAgICAgIG5pZGdldC5xdWVyeVNlbGVjdG9yKFwiLm5pZGdldC1oZWFkZXJcIikuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBuaWRnZXQub25Nb3VzZURvd24pOyAgICAgICAgXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIG5pZGdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIG5pZGdldC5vbk1vdXNlRG93bik7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIG5pZGdldC5vbk1vdXNlTW92ZSA9IG9uTW91c2VNb3ZlLmJpbmQobmlkZ2V0KTsgICAgXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBuaWRnZXQub25Nb3VzZU1vdmUpO1xyXG5cclxuICAgIG5pZGdldC5vbk1vdXNlVXAgPSBvbk1vdXNlVXAuYmluZChuaWRnZXQpOyAgICBcclxuICAgIG5pZGdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBuaWRnZXQub25Nb3VzZVVwKTtcclxuXHJcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbmNvbnN0IE5pZGdldCA9IHJlcXVpcmUoXCIuLi9OaWRnZXRcIik7XHJcbndpbmRvdy5OaWRnZXQgPSBOaWRnZXQ7XHJcblxyXG4vKipcclxuICogQWRkIGEgcmVzaXplIG9ic2VydmVyIHRvIHRoZSBlbGVtZW50IHRoYXQgd2lsbCBjYWxsIGEgb25SZXNpemUoKSBmdW5jdGlvbi5cclxuICogVGhlIHBhcmFtZXRlcnMgcGFzc2VkIGluIGFyZSAocHJldmlvdXNfZGltZW5zaW9ucykuICBUbyB1c2UgYWRkXHJcbiAqIGludGVyZmFjZXM9XCJyZXNpemVcIiB0byB0aGUgZWxlbWVudCBpbiBodG1sIGFuZCBhIG1ldGhvZCBvblJlc2l6ZSgpIHRvIHRoZSBcclxuICogY2xhc3Mgb2JqZWN0LiAgSWYgdGhlcmUgaXMgbm8gY2xhc3Mgb2JqZWN0IGNyZWF0ZSBhIGZ1bmN0aW9uIGFuZCBiaW5kIGl0LlxyXG4gKiBpZTogZWxlbWVudC5vblJlc2l6ZSA9IGZ1bmN0aW9uLmJpbmQoZWxlbWVudCk7IFxyXG4gKi9cclxuXHJcbmxldCBvblJlc2l6ZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICBsZXQgZGF0YSA9IHRoaXNbTmlkZ2V0LmludGVyZmFjZURhdGFGaWVsZF0ucmVzaXplO1xyXG4gICAgbGV0IHByZXYgPSBkYXRhLnByZXY7XHJcbiAgICBpZiAoIXRoaXMub25SZXNpemUpIHJldHVybjtcclxuICAgIHRoaXMub25SZXNpemUocHJldik7XHJcbiAgICBsb2FkUHJldmlvdXModGhpcyk7XHJcbn07XHJcblxyXG5sZXQgbG9hZFByZXZpb3VzID0gZnVuY3Rpb24obmlkZ2V0KXtcclxuICAgIGxldCBkYXRhID0gbmlkZ2V0W05pZGdldC5pbnRlcmZhY2VEYXRhRmllbGRdLnJlc2l6ZTtcclxuICAgIGRhdGEucHJldiA9IHtcclxuICAgICAgICB3aWR0aCA6IG5pZGdldC5vZmZzZXRXaWR0aCxcclxuICAgICAgICBoZWlnaHQgOiBuaWRnZXQub2Zmc2V0SGVpZ2h0XHJcbiAgICB9OyAgICBcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBhIHJlc2l6ZSBvYnNlcnZlciBmb3IgdGhlIG5pZGdldCB0aGF0IHRyaWdnZXJzIHRoZSBvblJlc2l6ZSBtZXRob2QgaWYgXHJcbiAqIGF2YWlsYWJsZS5cclxuICogLSBvblJlc2l6ZSh0aGlzLCBwcmV2aW91c19kaW1lbnNpb25zKSA6IG5vbmVcclxuICogQHBhcmFtIHt0eXBlfSBuaWRnZXRcclxuICogQHJldHVybiB7dW5kZWZpbmVkfVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihuaWRnZXQpe1xyXG4gICAgaWYgKHR5cGVvZihuaWRnZXQpICE9PSBcIm9iamVjdFwiKSB0aHJvdyBuZXcgXCJPYmplY3QgZXhlY3RlZFwiO1xyXG4gICAgbGV0IHJlc2l6ZU9ic2VydmVyID0gbmV3IFJlc2l6ZU9ic2VydmVyKG9uUmVzaXplLmJpbmQobmlkZ2V0KSk7XHJcbiAgICByZXNpemVPYnNlcnZlci5vYnNlcnZlKG5pZGdldCk7XHJcbiAgICBsb2FkUHJldmlvdXMobmlkZ2V0KTtcclxufTsiLCIndXNlIHN0cmljdCc7XHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgQWJzdHJhY3RNb2RlbCA6IHJlcXVpcmUoXCIuL0Fic3RyYWN0TW9kZWxcIiksXHJcbiAgICBOaWRnZXRFbGVtZW50IDogcmVxdWlyZShcIi4vTmlkZ2V0RWxlbWVudFwiKSxcclxuICAgIEZpbGVPcGVyYXRpb25zIDogcmVxdWlyZShcIi4vRmlsZU9wZXJhdGlvbnNcIiksXHJcbiAgICBOaWRnZXRCdXR0b25TZXQgOiByZXF1aXJlKFwiLi9uaWRnZXQtY29tcG9uZW50cy9OaWRnZXRCdXR0b25TZXRcIiksXHJcbiAgICBOaWRnZXRCdXR0b24gOiByZXF1aXJlKFwiLi9uaWRnZXQtY29tcG9uZW50cy9OaWRnZXRCdXR0b25cIiksXHJcbiAgICBOaWRnZXRCdXR0b25TdGF0ZSA6IHJlcXVpcmUoXCIuL25pZGdldC1jb21wb25lbnRzL05pZGdldEJ1dHRvblN0YXRlXCIpLFxyXG4gICAgTmlkZ2V0SW1hZ2UgOiByZXF1aXJlKFwiLi9uaWRnZXQtY29tcG9uZW50cy9OaWRnZXRJbWFnZVwiKSxcclxuICAgIE5pZGdldEhUTUxJbWFnZSA6IHJlcXVpcmUoXCIuL25pZGdldC1jb21wb25lbnRzL05pZGdldEhUTUxJbWFnZVwiKSxcclxuICAgIE5pZGdldFRleHQgOiByZXF1aXJlKFwiLi9uaWRnZXQtY29tcG9uZW50cy9OaWRnZXRUZXh0XCIpLFxyXG4gICAgTmlkZ2V0Q29udGFpbmVyIDogcmVxdWlyZShcIi4vbmlkZ2V0LWNvbXBvbmVudHMvTmlkZ2V0Q29udGFpbmVyXCIpLFxyXG4gICAgTW91c2VVdGlsaXRpZXMgOiByZXF1aXJlKFwiLi9Nb3VzZVV0aWxpdGllc1wiKSxcclxuICAgIENvbnN0YW50czogcmVxdWlyZShcIi4vTmlkZ2V0XCIpLFxyXG4gICAgbGF5b3V0czoge31cclxufTsiLCJmdW5jdGlvbiBfYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpIHtcbiAgaWYgKHNlbGYgPT09IHZvaWQgMCkge1xuICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTtcbiAgfVxuXG4gIHJldHVybiBzZWxmO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IF9hc3NlcnRUaGlzSW5pdGlhbGl6ZWQ7XG5tb2R1bGUuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBtb2R1bGUuZXhwb3J0cywgbW9kdWxlLmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwiZnVuY3Rpb24gYXN5bmNHZW5lcmF0b3JTdGVwKGdlbiwgcmVzb2x2ZSwgcmVqZWN0LCBfbmV4dCwgX3Rocm93LCBrZXksIGFyZykge1xuICB0cnkge1xuICAgIHZhciBpbmZvID0gZ2VuW2tleV0oYXJnKTtcbiAgICB2YXIgdmFsdWUgPSBpbmZvLnZhbHVlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJlamVjdChlcnJvcik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGluZm8uZG9uZSkge1xuICAgIHJlc29sdmUodmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIFByb21pc2UucmVzb2x2ZSh2YWx1ZSkudGhlbihfbmV4dCwgX3Rocm93KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfYXN5bmNUb0dlbmVyYXRvcihmbikge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdmFyIGdlbiA9IGZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuXG4gICAgICBmdW5jdGlvbiBfbmV4dCh2YWx1ZSkge1xuICAgICAgICBhc3luY0dlbmVyYXRvclN0ZXAoZ2VuLCByZXNvbHZlLCByZWplY3QsIF9uZXh0LCBfdGhyb3csIFwibmV4dFwiLCB2YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIF90aHJvdyhlcnIpIHtcbiAgICAgICAgYXN5bmNHZW5lcmF0b3JTdGVwKGdlbiwgcmVzb2x2ZSwgcmVqZWN0LCBfbmV4dCwgX3Rocm93LCBcInRocm93XCIsIGVycik7XG4gICAgICB9XG5cbiAgICAgIF9uZXh0KHVuZGVmaW5lZCk7XG4gICAgfSk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gX2FzeW5jVG9HZW5lcmF0b3I7XG5tb2R1bGUuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBtb2R1bGUuZXhwb3J0cywgbW9kdWxlLmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwiZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3Rvcikge1xuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfY2xhc3NDYWxsQ2hlY2s7XG5tb2R1bGUuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBtb2R1bGUuZXhwb3J0cywgbW9kdWxlLmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwidmFyIHNldFByb3RvdHlwZU9mID0gcmVxdWlyZShcIi4vc2V0UHJvdG90eXBlT2YuanNcIik7XG5cbnZhciBpc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QgPSByZXF1aXJlKFwiLi9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QuanNcIik7XG5cbmZ1bmN0aW9uIF9jb25zdHJ1Y3QoUGFyZW50LCBhcmdzLCBDbGFzcykge1xuICBpZiAoaXNOYXRpdmVSZWZsZWN0Q29uc3RydWN0KCkpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IF9jb25zdHJ1Y3QgPSBSZWZsZWN0LmNvbnN0cnVjdDtcbiAgICBtb2R1bGUuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBtb2R1bGUuZXhwb3J0cywgbW9kdWxlLmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBfY29uc3RydWN0ID0gZnVuY3Rpb24gX2NvbnN0cnVjdChQYXJlbnQsIGFyZ3MsIENsYXNzKSB7XG4gICAgICB2YXIgYSA9IFtudWxsXTtcbiAgICAgIGEucHVzaC5hcHBseShhLCBhcmdzKTtcbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IEZ1bmN0aW9uLmJpbmQuYXBwbHkoUGFyZW50LCBhKTtcbiAgICAgIHZhciBpbnN0YW5jZSA9IG5ldyBDb25zdHJ1Y3RvcigpO1xuICAgICAgaWYgKENsYXNzKSBzZXRQcm90b3R5cGVPZihpbnN0YW5jZSwgQ2xhc3MucHJvdG90eXBlKTtcbiAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gbW9kdWxlLmV4cG9ydHMsIG1vZHVsZS5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIF9jb25zdHJ1Y3QuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfY29uc3RydWN0O1xubW9kdWxlLmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gbW9kdWxlLmV4cG9ydHMsIG1vZHVsZS5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlOyIsImZ1bmN0aW9uIF9kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07XG4gICAgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlO1xuICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gIGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpO1xuICBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7XG4gIHJldHVybiBDb25zdHJ1Y3Rvcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfY3JlYXRlQ2xhc3M7XG5tb2R1bGUuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBtb2R1bGUuZXhwb3J0cywgbW9kdWxlLmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwidmFyIHN1cGVyUHJvcEJhc2UgPSByZXF1aXJlKFwiLi9zdXBlclByb3BCYXNlLmpzXCIpO1xuXG5mdW5jdGlvbiBfZ2V0KHRhcmdldCwgcHJvcGVydHksIHJlY2VpdmVyKSB7XG4gIGlmICh0eXBlb2YgUmVmbGVjdCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBSZWZsZWN0LmdldCkge1xuICAgIG1vZHVsZS5leHBvcnRzID0gX2dldCA9IFJlZmxlY3QuZ2V0O1xuICAgIG1vZHVsZS5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IG1vZHVsZS5leHBvcnRzLCBtb2R1bGUuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IF9nZXQgPSBmdW5jdGlvbiBfZ2V0KHRhcmdldCwgcHJvcGVydHksIHJlY2VpdmVyKSB7XG4gICAgICB2YXIgYmFzZSA9IHN1cGVyUHJvcEJhc2UodGFyZ2V0LCBwcm9wZXJ0eSk7XG4gICAgICBpZiAoIWJhc2UpIHJldHVybjtcbiAgICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihiYXNlLCBwcm9wZXJ0eSk7XG5cbiAgICAgIGlmIChkZXNjLmdldCkge1xuICAgICAgICByZXR1cm4gZGVzYy5nZXQuY2FsbChyZWNlaXZlcik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkZXNjLnZhbHVlO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBtb2R1bGUuZXhwb3J0cywgbW9kdWxlLmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG4gIH1cblxuICByZXR1cm4gX2dldCh0YXJnZXQsIHByb3BlcnR5LCByZWNlaXZlciB8fCB0YXJnZXQpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IF9nZXQ7XG5tb2R1bGUuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBtb2R1bGUuZXhwb3J0cywgbW9kdWxlLmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwiZnVuY3Rpb24gX2dldFByb3RvdHlwZU9mKG8pIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBfZ2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YgOiBmdW5jdGlvbiBfZ2V0UHJvdG90eXBlT2Yobykge1xuICAgIHJldHVybiBvLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobyk7XG4gIH07XG4gIG1vZHVsZS5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IG1vZHVsZS5leHBvcnRzLCBtb2R1bGUuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbiAgcmV0dXJuIF9nZXRQcm90b3R5cGVPZihvKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfZ2V0UHJvdG90eXBlT2Y7XG5tb2R1bGUuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBtb2R1bGUuZXhwb3J0cywgbW9kdWxlLmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwidmFyIHNldFByb3RvdHlwZU9mID0gcmVxdWlyZShcIi4vc2V0UHJvdG90eXBlT2YuanNcIik7XG5cbmZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykge1xuICBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uXCIpO1xuICB9XG5cbiAgc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7XG4gICAgY29uc3RydWN0b3I6IHtcbiAgICAgIHZhbHVlOiBzdWJDbGFzcyxcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfVxuICB9KTtcbiAgaWYgKHN1cGVyQ2xhc3MpIHNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfaW5oZXJpdHM7XG5tb2R1bGUuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBtb2R1bGUuZXhwb3J0cywgbW9kdWxlLmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwiZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHtcbiAgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHtcbiAgICBcImRlZmF1bHRcIjogb2JqXG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdDtcbm1vZHVsZS5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IG1vZHVsZS5leHBvcnRzLCBtb2R1bGUuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTsiLCJmdW5jdGlvbiBfaXNOYXRpdmVGdW5jdGlvbihmbikge1xuICByZXR1cm4gRnVuY3Rpb24udG9TdHJpbmcuY2FsbChmbikuaW5kZXhPZihcIltuYXRpdmUgY29kZV1cIikgIT09IC0xO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IF9pc05hdGl2ZUZ1bmN0aW9uO1xubW9kdWxlLmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gbW9kdWxlLmV4cG9ydHMsIG1vZHVsZS5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlOyIsImZ1bmN0aW9uIF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3QoKSB7XG4gIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhUmVmbGVjdC5jb25zdHJ1Y3QpIHJldHVybiBmYWxzZTtcbiAgaWYgKFJlZmxlY3QuY29uc3RydWN0LnNoYW0pIHJldHVybiBmYWxzZTtcbiAgaWYgKHR5cGVvZiBQcm94eSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdHJ1ZTtcblxuICB0cnkge1xuICAgIEJvb2xlYW4ucHJvdG90eXBlLnZhbHVlT2YuY2FsbChSZWZsZWN0LmNvbnN0cnVjdChCb29sZWFuLCBbXSwgZnVuY3Rpb24gKCkge30pKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IF9pc05hdGl2ZVJlZmxlY3RDb25zdHJ1Y3Q7XG5tb2R1bGUuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBtb2R1bGUuZXhwb3J0cywgbW9kdWxlLmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwidmFyIF90eXBlb2YgPSByZXF1aXJlKFwiQGJhYmVsL3J1bnRpbWUvaGVscGVycy90eXBlb2ZcIilbXCJkZWZhdWx0XCJdO1xuXG52YXIgYXNzZXJ0VGhpc0luaXRpYWxpemVkID0gcmVxdWlyZShcIi4vYXNzZXJ0VGhpc0luaXRpYWxpemVkLmpzXCIpO1xuXG5mdW5jdGlvbiBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybihzZWxmLCBjYWxsKSB7XG4gIGlmIChjYWxsICYmIChfdHlwZW9mKGNhbGwpID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpKSB7XG4gICAgcmV0dXJuIGNhbGw7XG4gIH1cblxuICByZXR1cm4gYXNzZXJ0VGhpc0luaXRpYWxpemVkKHNlbGYpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuO1xubW9kdWxlLmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gbW9kdWxlLmV4cG9ydHMsIG1vZHVsZS5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlOyIsImZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gX3NldFByb3RvdHlwZU9mID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uIF9zZXRQcm90b3R5cGVPZihvLCBwKSB7XG4gICAgby5fX3Byb3RvX18gPSBwO1xuICAgIHJldHVybiBvO1xuICB9O1xuXG4gIG1vZHVsZS5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IG1vZHVsZS5leHBvcnRzLCBtb2R1bGUuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbiAgcmV0dXJuIF9zZXRQcm90b3R5cGVPZihvLCBwKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfc2V0UHJvdG90eXBlT2Y7XG5tb2R1bGUuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBtb2R1bGUuZXhwb3J0cywgbW9kdWxlLmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwidmFyIGdldFByb3RvdHlwZU9mID0gcmVxdWlyZShcIi4vZ2V0UHJvdG90eXBlT2YuanNcIik7XG5cbmZ1bmN0aW9uIF9zdXBlclByb3BCYXNlKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgd2hpbGUgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkpIHtcbiAgICBvYmplY3QgPSBnZXRQcm90b3R5cGVPZihvYmplY3QpO1xuICAgIGlmIChvYmplY3QgPT09IG51bGwpIGJyZWFrO1xuICB9XG5cbiAgcmV0dXJuIG9iamVjdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfc3VwZXJQcm9wQmFzZTtcbm1vZHVsZS5leHBvcnRzW1wiZGVmYXVsdFwiXSA9IG1vZHVsZS5leHBvcnRzLCBtb2R1bGUuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTsiLCJmdW5jdGlvbiBfdHlwZW9mKG9iaikge1xuICBcIkBiYWJlbC9oZWxwZXJzIC0gdHlwZW9mXCI7XG5cbiAgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2Ygb2JqO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBtb2R1bGUuZXhwb3J0cywgbW9kdWxlLmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHtcbiAgICAgIHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBtb2R1bGUuZXhwb3J0cywgbW9kdWxlLmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG4gIH1cblxuICByZXR1cm4gX3R5cGVvZihvYmopO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IF90eXBlb2Y7XG5tb2R1bGUuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBtb2R1bGUuZXhwb3J0cywgbW9kdWxlLmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7IiwidmFyIGdldFByb3RvdHlwZU9mID0gcmVxdWlyZShcIi4vZ2V0UHJvdG90eXBlT2YuanNcIik7XG5cbnZhciBzZXRQcm90b3R5cGVPZiA9IHJlcXVpcmUoXCIuL3NldFByb3RvdHlwZU9mLmpzXCIpO1xuXG52YXIgaXNOYXRpdmVGdW5jdGlvbiA9IHJlcXVpcmUoXCIuL2lzTmF0aXZlRnVuY3Rpb24uanNcIik7XG5cbnZhciBjb25zdHJ1Y3QgPSByZXF1aXJlKFwiLi9jb25zdHJ1Y3QuanNcIik7XG5cbmZ1bmN0aW9uIF93cmFwTmF0aXZlU3VwZXIoQ2xhc3MpIHtcbiAgdmFyIF9jYWNoZSA9IHR5cGVvZiBNYXAgPT09IFwiZnVuY3Rpb25cIiA/IG5ldyBNYXAoKSA6IHVuZGVmaW5lZDtcblxuICBtb2R1bGUuZXhwb3J0cyA9IF93cmFwTmF0aXZlU3VwZXIgPSBmdW5jdGlvbiBfd3JhcE5hdGl2ZVN1cGVyKENsYXNzKSB7XG4gICAgaWYgKENsYXNzID09PSBudWxsIHx8ICFpc05hdGl2ZUZ1bmN0aW9uKENsYXNzKSkgcmV0dXJuIENsYXNzO1xuXG4gICAgaWYgKHR5cGVvZiBDbGFzcyAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb25cIik7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBfY2FjaGUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlmIChfY2FjaGUuaGFzKENsYXNzKSkgcmV0dXJuIF9jYWNoZS5nZXQoQ2xhc3MpO1xuXG4gICAgICBfY2FjaGUuc2V0KENsYXNzLCBXcmFwcGVyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBXcmFwcGVyKCkge1xuICAgICAgcmV0dXJuIGNvbnN0cnVjdChDbGFzcywgYXJndW1lbnRzLCBnZXRQcm90b3R5cGVPZih0aGlzKS5jb25zdHJ1Y3Rvcik7XG4gICAgfVxuXG4gICAgV3JhcHBlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKENsYXNzLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IFdyYXBwZXIsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHNldFByb3RvdHlwZU9mKFdyYXBwZXIsIENsYXNzKTtcbiAgfTtcblxuICBtb2R1bGUuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBtb2R1bGUuZXhwb3J0cywgbW9kdWxlLmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG4gIHJldHVybiBfd3JhcE5hdGl2ZVN1cGVyKENsYXNzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBfd3JhcE5hdGl2ZVN1cGVyO1xubW9kdWxlLmV4cG9ydHNbXCJkZWZhdWx0XCJdID0gbW9kdWxlLmV4cG9ydHMsIG1vZHVsZS5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcInJlZ2VuZXJhdG9yLXJ1bnRpbWVcIik7XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNC1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciBydW50aW1lID0gKGZ1bmN0aW9uIChleHBvcnRzKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIHZhciBPcCA9IE9iamVjdC5wcm90b3R5cGU7XG4gIHZhciBoYXNPd24gPSBPcC5oYXNPd25Qcm9wZXJ0eTtcbiAgdmFyIHVuZGVmaW5lZDsgLy8gTW9yZSBjb21wcmVzc2libGUgdGhhbiB2b2lkIDAuXG4gIHZhciAkU3ltYm9sID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiID8gU3ltYm9sIDoge307XG4gIHZhciBpdGVyYXRvclN5bWJvbCA9ICRTeW1ib2wuaXRlcmF0b3IgfHwgXCJAQGl0ZXJhdG9yXCI7XG4gIHZhciBhc3luY0l0ZXJhdG9yU3ltYm9sID0gJFN5bWJvbC5hc3luY0l0ZXJhdG9yIHx8IFwiQEBhc3luY0l0ZXJhdG9yXCI7XG4gIHZhciB0b1N0cmluZ1RhZ1N5bWJvbCA9ICRTeW1ib2wudG9TdHJpbmdUYWcgfHwgXCJAQHRvU3RyaW5nVGFnXCI7XG5cbiAgZnVuY3Rpb24gZGVmaW5lKG9iaiwga2V5LCB2YWx1ZSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwge1xuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgcmV0dXJuIG9ialtrZXldO1xuICB9XG4gIHRyeSB7XG4gICAgLy8gSUUgOCBoYXMgYSBicm9rZW4gT2JqZWN0LmRlZmluZVByb3BlcnR5IHRoYXQgb25seSB3b3JrcyBvbiBET00gb2JqZWN0cy5cbiAgICBkZWZpbmUoe30sIFwiXCIpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBkZWZpbmUgPSBmdW5jdGlvbihvYmosIGtleSwgdmFsdWUpIHtcbiAgICAgIHJldHVybiBvYmpba2V5XSA9IHZhbHVlO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB3cmFwKGlubmVyRm4sIG91dGVyRm4sIHNlbGYsIHRyeUxvY3NMaXN0KSB7XG4gICAgLy8gSWYgb3V0ZXJGbiBwcm92aWRlZCBhbmQgb3V0ZXJGbi5wcm90b3R5cGUgaXMgYSBHZW5lcmF0b3IsIHRoZW4gb3V0ZXJGbi5wcm90b3R5cGUgaW5zdGFuY2VvZiBHZW5lcmF0b3IuXG4gICAgdmFyIHByb3RvR2VuZXJhdG9yID0gb3V0ZXJGbiAmJiBvdXRlckZuLnByb3RvdHlwZSBpbnN0YW5jZW9mIEdlbmVyYXRvciA/IG91dGVyRm4gOiBHZW5lcmF0b3I7XG4gICAgdmFyIGdlbmVyYXRvciA9IE9iamVjdC5jcmVhdGUocHJvdG9HZW5lcmF0b3IucHJvdG90eXBlKTtcbiAgICB2YXIgY29udGV4dCA9IG5ldyBDb250ZXh0KHRyeUxvY3NMaXN0IHx8IFtdKTtcblxuICAgIC8vIFRoZSAuX2ludm9rZSBtZXRob2QgdW5pZmllcyB0aGUgaW1wbGVtZW50YXRpb25zIG9mIHRoZSAubmV4dCxcbiAgICAvLyAudGhyb3csIGFuZCAucmV0dXJuIG1ldGhvZHMuXG4gICAgZ2VuZXJhdG9yLl9pbnZva2UgPSBtYWtlSW52b2tlTWV0aG9kKGlubmVyRm4sIHNlbGYsIGNvbnRleHQpO1xuXG4gICAgcmV0dXJuIGdlbmVyYXRvcjtcbiAgfVxuICBleHBvcnRzLndyYXAgPSB3cmFwO1xuXG4gIC8vIFRyeS9jYXRjaCBoZWxwZXIgdG8gbWluaW1pemUgZGVvcHRpbWl6YXRpb25zLiBSZXR1cm5zIGEgY29tcGxldGlvblxuICAvLyByZWNvcmQgbGlrZSBjb250ZXh0LnRyeUVudHJpZXNbaV0uY29tcGxldGlvbi4gVGhpcyBpbnRlcmZhY2UgY291bGRcbiAgLy8gaGF2ZSBiZWVuIChhbmQgd2FzIHByZXZpb3VzbHkpIGRlc2lnbmVkIHRvIHRha2UgYSBjbG9zdXJlIHRvIGJlXG4gIC8vIGludm9rZWQgd2l0aG91dCBhcmd1bWVudHMsIGJ1dCBpbiBhbGwgdGhlIGNhc2VzIHdlIGNhcmUgYWJvdXQgd2VcbiAgLy8gYWxyZWFkeSBoYXZlIGFuIGV4aXN0aW5nIG1ldGhvZCB3ZSB3YW50IHRvIGNhbGwsIHNvIHRoZXJlJ3Mgbm8gbmVlZFxuICAvLyB0byBjcmVhdGUgYSBuZXcgZnVuY3Rpb24gb2JqZWN0LiBXZSBjYW4gZXZlbiBnZXQgYXdheSB3aXRoIGFzc3VtaW5nXG4gIC8vIHRoZSBtZXRob2QgdGFrZXMgZXhhY3RseSBvbmUgYXJndW1lbnQsIHNpbmNlIHRoYXQgaGFwcGVucyB0byBiZSB0cnVlXG4gIC8vIGluIGV2ZXJ5IGNhc2UsIHNvIHdlIGRvbid0IGhhdmUgdG8gdG91Y2ggdGhlIGFyZ3VtZW50cyBvYmplY3QuIFRoZVxuICAvLyBvbmx5IGFkZGl0aW9uYWwgYWxsb2NhdGlvbiByZXF1aXJlZCBpcyB0aGUgY29tcGxldGlvbiByZWNvcmQsIHdoaWNoXG4gIC8vIGhhcyBhIHN0YWJsZSBzaGFwZSBhbmQgc28gaG9wZWZ1bGx5IHNob3VsZCBiZSBjaGVhcCB0byBhbGxvY2F0ZS5cbiAgZnVuY3Rpb24gdHJ5Q2F0Y2goZm4sIG9iaiwgYXJnKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB7IHR5cGU6IFwibm9ybWFsXCIsIGFyZzogZm4uY2FsbChvYmosIGFyZykgfTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiB7IHR5cGU6IFwidGhyb3dcIiwgYXJnOiBlcnIgfTtcbiAgICB9XG4gIH1cblxuICB2YXIgR2VuU3RhdGVTdXNwZW5kZWRTdGFydCA9IFwic3VzcGVuZGVkU3RhcnRcIjtcbiAgdmFyIEdlblN0YXRlU3VzcGVuZGVkWWllbGQgPSBcInN1c3BlbmRlZFlpZWxkXCI7XG4gIHZhciBHZW5TdGF0ZUV4ZWN1dGluZyA9IFwiZXhlY3V0aW5nXCI7XG4gIHZhciBHZW5TdGF0ZUNvbXBsZXRlZCA9IFwiY29tcGxldGVkXCI7XG5cbiAgLy8gUmV0dXJuaW5nIHRoaXMgb2JqZWN0IGZyb20gdGhlIGlubmVyRm4gaGFzIHRoZSBzYW1lIGVmZmVjdCBhc1xuICAvLyBicmVha2luZyBvdXQgb2YgdGhlIGRpc3BhdGNoIHN3aXRjaCBzdGF0ZW1lbnQuXG4gIHZhciBDb250aW51ZVNlbnRpbmVsID0ge307XG5cbiAgLy8gRHVtbXkgY29uc3RydWN0b3IgZnVuY3Rpb25zIHRoYXQgd2UgdXNlIGFzIHRoZSAuY29uc3RydWN0b3IgYW5kXG4gIC8vIC5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgcHJvcGVydGllcyBmb3IgZnVuY3Rpb25zIHRoYXQgcmV0dXJuIEdlbmVyYXRvclxuICAvLyBvYmplY3RzLiBGb3IgZnVsbCBzcGVjIGNvbXBsaWFuY2UsIHlvdSBtYXkgd2lzaCB0byBjb25maWd1cmUgeW91clxuICAvLyBtaW5pZmllciBub3QgdG8gbWFuZ2xlIHRoZSBuYW1lcyBvZiB0aGVzZSB0d28gZnVuY3Rpb25zLlxuICBmdW5jdGlvbiBHZW5lcmF0b3IoKSB7fVxuICBmdW5jdGlvbiBHZW5lcmF0b3JGdW5jdGlvbigpIHt9XG4gIGZ1bmN0aW9uIEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlKCkge31cblxuICAvLyBUaGlzIGlzIGEgcG9seWZpbGwgZm9yICVJdGVyYXRvclByb3RvdHlwZSUgZm9yIGVudmlyb25tZW50cyB0aGF0XG4gIC8vIGRvbid0IG5hdGl2ZWx5IHN1cHBvcnQgaXQuXG4gIHZhciBJdGVyYXRvclByb3RvdHlwZSA9IHt9O1xuICBJdGVyYXRvclByb3RvdHlwZVtpdGVyYXRvclN5bWJvbF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgdmFyIGdldFByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mO1xuICB2YXIgTmF0aXZlSXRlcmF0b3JQcm90b3R5cGUgPSBnZXRQcm90byAmJiBnZXRQcm90byhnZXRQcm90byh2YWx1ZXMoW10pKSk7XG4gIGlmIChOYXRpdmVJdGVyYXRvclByb3RvdHlwZSAmJlxuICAgICAgTmF0aXZlSXRlcmF0b3JQcm90b3R5cGUgIT09IE9wICYmXG4gICAgICBoYXNPd24uY2FsbChOYXRpdmVJdGVyYXRvclByb3RvdHlwZSwgaXRlcmF0b3JTeW1ib2wpKSB7XG4gICAgLy8gVGhpcyBlbnZpcm9ubWVudCBoYXMgYSBuYXRpdmUgJUl0ZXJhdG9yUHJvdG90eXBlJTsgdXNlIGl0IGluc3RlYWRcbiAgICAvLyBvZiB0aGUgcG9seWZpbGwuXG4gICAgSXRlcmF0b3JQcm90b3R5cGUgPSBOYXRpdmVJdGVyYXRvclByb3RvdHlwZTtcbiAgfVxuXG4gIHZhciBHcCA9IEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlLnByb3RvdHlwZSA9XG4gICAgR2VuZXJhdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSXRlcmF0b3JQcm90b3R5cGUpO1xuICBHZW5lcmF0b3JGdW5jdGlvbi5wcm90b3R5cGUgPSBHcC5jb25zdHJ1Y3RvciA9IEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlO1xuICBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEdlbmVyYXRvckZ1bmN0aW9uO1xuICBHZW5lcmF0b3JGdW5jdGlvbi5kaXNwbGF5TmFtZSA9IGRlZmluZShcbiAgICBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZSxcbiAgICB0b1N0cmluZ1RhZ1N5bWJvbCxcbiAgICBcIkdlbmVyYXRvckZ1bmN0aW9uXCJcbiAgKTtcblxuICAvLyBIZWxwZXIgZm9yIGRlZmluaW5nIHRoZSAubmV4dCwgLnRocm93LCBhbmQgLnJldHVybiBtZXRob2RzIG9mIHRoZVxuICAvLyBJdGVyYXRvciBpbnRlcmZhY2UgaW4gdGVybXMgb2YgYSBzaW5nbGUgLl9pbnZva2UgbWV0aG9kLlxuICBmdW5jdGlvbiBkZWZpbmVJdGVyYXRvck1ldGhvZHMocHJvdG90eXBlKSB7XG4gICAgW1wibmV4dFwiLCBcInRocm93XCIsIFwicmV0dXJuXCJdLmZvckVhY2goZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICBkZWZpbmUocHJvdG90eXBlLCBtZXRob2QsIGZ1bmN0aW9uKGFyZykge1xuICAgICAgICByZXR1cm4gdGhpcy5faW52b2tlKG1ldGhvZCwgYXJnKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZXhwb3J0cy5pc0dlbmVyYXRvckZ1bmN0aW9uID0gZnVuY3Rpb24oZ2VuRnVuKSB7XG4gICAgdmFyIGN0b3IgPSB0eXBlb2YgZ2VuRnVuID09PSBcImZ1bmN0aW9uXCIgJiYgZ2VuRnVuLmNvbnN0cnVjdG9yO1xuICAgIHJldHVybiBjdG9yXG4gICAgICA/IGN0b3IgPT09IEdlbmVyYXRvckZ1bmN0aW9uIHx8XG4gICAgICAgIC8vIEZvciB0aGUgbmF0aXZlIEdlbmVyYXRvckZ1bmN0aW9uIGNvbnN0cnVjdG9yLCB0aGUgYmVzdCB3ZSBjYW5cbiAgICAgICAgLy8gZG8gaXMgdG8gY2hlY2sgaXRzIC5uYW1lIHByb3BlcnR5LlxuICAgICAgICAoY3Rvci5kaXNwbGF5TmFtZSB8fCBjdG9yLm5hbWUpID09PSBcIkdlbmVyYXRvckZ1bmN0aW9uXCJcbiAgICAgIDogZmFsc2U7XG4gIH07XG5cbiAgZXhwb3J0cy5tYXJrID0gZnVuY3Rpb24oZ2VuRnVuKSB7XG4gICAgaWYgKE9iamVjdC5zZXRQcm90b3R5cGVPZikge1xuICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKGdlbkZ1biwgR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnZW5GdW4uX19wcm90b19fID0gR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGU7XG4gICAgICBkZWZpbmUoZ2VuRnVuLCB0b1N0cmluZ1RhZ1N5bWJvbCwgXCJHZW5lcmF0b3JGdW5jdGlvblwiKTtcbiAgICB9XG4gICAgZ2VuRnVuLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoR3ApO1xuICAgIHJldHVybiBnZW5GdW47XG4gIH07XG5cbiAgLy8gV2l0aGluIHRoZSBib2R5IG9mIGFueSBhc3luYyBmdW5jdGlvbiwgYGF3YWl0IHhgIGlzIHRyYW5zZm9ybWVkIHRvXG4gIC8vIGB5aWVsZCByZWdlbmVyYXRvclJ1bnRpbWUuYXdyYXAoeClgLCBzbyB0aGF0IHRoZSBydW50aW1lIGNhbiB0ZXN0XG4gIC8vIGBoYXNPd24uY2FsbCh2YWx1ZSwgXCJfX2F3YWl0XCIpYCB0byBkZXRlcm1pbmUgaWYgdGhlIHlpZWxkZWQgdmFsdWUgaXNcbiAgLy8gbWVhbnQgdG8gYmUgYXdhaXRlZC5cbiAgZXhwb3J0cy5hd3JhcCA9IGZ1bmN0aW9uKGFyZykge1xuICAgIHJldHVybiB7IF9fYXdhaXQ6IGFyZyB9O1xuICB9O1xuXG4gIGZ1bmN0aW9uIEFzeW5jSXRlcmF0b3IoZ2VuZXJhdG9yLCBQcm9taXNlSW1wbCkge1xuICAgIGZ1bmN0aW9uIGludm9rZShtZXRob2QsIGFyZywgcmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB2YXIgcmVjb3JkID0gdHJ5Q2F0Y2goZ2VuZXJhdG9yW21ldGhvZF0sIGdlbmVyYXRvciwgYXJnKTtcbiAgICAgIGlmIChyZWNvcmQudHlwZSA9PT0gXCJ0aHJvd1wiKSB7XG4gICAgICAgIHJlamVjdChyZWNvcmQuYXJnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciByZXN1bHQgPSByZWNvcmQuYXJnO1xuICAgICAgICB2YXIgdmFsdWUgPSByZXN1bHQudmFsdWU7XG4gICAgICAgIGlmICh2YWx1ZSAmJlxuICAgICAgICAgICAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgICAgICBoYXNPd24uY2FsbCh2YWx1ZSwgXCJfX2F3YWl0XCIpKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2VJbXBsLnJlc29sdmUodmFsdWUuX19hd2FpdCkudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaW52b2tlKFwibmV4dFwiLCB2YWx1ZSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIGludm9rZShcInRocm93XCIsIGVyciwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBQcm9taXNlSW1wbC5yZXNvbHZlKHZhbHVlKS50aGVuKGZ1bmN0aW9uKHVud3JhcHBlZCkge1xuICAgICAgICAgIC8vIFdoZW4gYSB5aWVsZGVkIFByb21pc2UgaXMgcmVzb2x2ZWQsIGl0cyBmaW5hbCB2YWx1ZSBiZWNvbWVzXG4gICAgICAgICAgLy8gdGhlIC52YWx1ZSBvZiB0aGUgUHJvbWlzZTx7dmFsdWUsZG9uZX0+IHJlc3VsdCBmb3IgdGhlXG4gICAgICAgICAgLy8gY3VycmVudCBpdGVyYXRpb24uXG4gICAgICAgICAgcmVzdWx0LnZhbHVlID0gdW53cmFwcGVkO1xuICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAvLyBJZiBhIHJlamVjdGVkIFByb21pc2Ugd2FzIHlpZWxkZWQsIHRocm93IHRoZSByZWplY3Rpb24gYmFja1xuICAgICAgICAgIC8vIGludG8gdGhlIGFzeW5jIGdlbmVyYXRvciBmdW5jdGlvbiBzbyBpdCBjYW4gYmUgaGFuZGxlZCB0aGVyZS5cbiAgICAgICAgICByZXR1cm4gaW52b2tlKFwidGhyb3dcIiwgZXJyb3IsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBwcmV2aW91c1Byb21pc2U7XG5cbiAgICBmdW5jdGlvbiBlbnF1ZXVlKG1ldGhvZCwgYXJnKSB7XG4gICAgICBmdW5jdGlvbiBjYWxsSW52b2tlV2l0aE1ldGhvZEFuZEFyZygpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlSW1wbChmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICBpbnZva2UobWV0aG9kLCBhcmcsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcHJldmlvdXNQcm9taXNlID1cbiAgICAgICAgLy8gSWYgZW5xdWV1ZSBoYXMgYmVlbiBjYWxsZWQgYmVmb3JlLCB0aGVuIHdlIHdhbnQgdG8gd2FpdCB1bnRpbFxuICAgICAgICAvLyBhbGwgcHJldmlvdXMgUHJvbWlzZXMgaGF2ZSBiZWVuIHJlc29sdmVkIGJlZm9yZSBjYWxsaW5nIGludm9rZSxcbiAgICAgICAgLy8gc28gdGhhdCByZXN1bHRzIGFyZSBhbHdheXMgZGVsaXZlcmVkIGluIHRoZSBjb3JyZWN0IG9yZGVyLiBJZlxuICAgICAgICAvLyBlbnF1ZXVlIGhhcyBub3QgYmVlbiBjYWxsZWQgYmVmb3JlLCB0aGVuIGl0IGlzIGltcG9ydGFudCB0b1xuICAgICAgICAvLyBjYWxsIGludm9rZSBpbW1lZGlhdGVseSwgd2l0aG91dCB3YWl0aW5nIG9uIGEgY2FsbGJhY2sgdG8gZmlyZSxcbiAgICAgICAgLy8gc28gdGhhdCB0aGUgYXN5bmMgZ2VuZXJhdG9yIGZ1bmN0aW9uIGhhcyB0aGUgb3Bwb3J0dW5pdHkgdG8gZG9cbiAgICAgICAgLy8gYW55IG5lY2Vzc2FyeSBzZXR1cCBpbiBhIHByZWRpY3RhYmxlIHdheS4gVGhpcyBwcmVkaWN0YWJpbGl0eVxuICAgICAgICAvLyBpcyB3aHkgdGhlIFByb21pc2UgY29uc3RydWN0b3Igc3luY2hyb25vdXNseSBpbnZva2VzIGl0c1xuICAgICAgICAvLyBleGVjdXRvciBjYWxsYmFjaywgYW5kIHdoeSBhc3luYyBmdW5jdGlvbnMgc3luY2hyb25vdXNseVxuICAgICAgICAvLyBleGVjdXRlIGNvZGUgYmVmb3JlIHRoZSBmaXJzdCBhd2FpdC4gU2luY2Ugd2UgaW1wbGVtZW50IHNpbXBsZVxuICAgICAgICAvLyBhc3luYyBmdW5jdGlvbnMgaW4gdGVybXMgb2YgYXN5bmMgZ2VuZXJhdG9ycywgaXQgaXMgZXNwZWNpYWxseVxuICAgICAgICAvLyBpbXBvcnRhbnQgdG8gZ2V0IHRoaXMgcmlnaHQsIGV2ZW4gdGhvdWdoIGl0IHJlcXVpcmVzIGNhcmUuXG4gICAgICAgIHByZXZpb3VzUHJvbWlzZSA/IHByZXZpb3VzUHJvbWlzZS50aGVuKFxuICAgICAgICAgIGNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnLFxuICAgICAgICAgIC8vIEF2b2lkIHByb3BhZ2F0aW5nIGZhaWx1cmVzIHRvIFByb21pc2VzIHJldHVybmVkIGJ5IGxhdGVyXG4gICAgICAgICAgLy8gaW52b2NhdGlvbnMgb2YgdGhlIGl0ZXJhdG9yLlxuICAgICAgICAgIGNhbGxJbnZva2VXaXRoTWV0aG9kQW5kQXJnXG4gICAgICAgICkgOiBjYWxsSW52b2tlV2l0aE1ldGhvZEFuZEFyZygpO1xuICAgIH1cblxuICAgIC8vIERlZmluZSB0aGUgdW5pZmllZCBoZWxwZXIgbWV0aG9kIHRoYXQgaXMgdXNlZCB0byBpbXBsZW1lbnQgLm5leHQsXG4gICAgLy8gLnRocm93LCBhbmQgLnJldHVybiAoc2VlIGRlZmluZUl0ZXJhdG9yTWV0aG9kcykuXG4gICAgdGhpcy5faW52b2tlID0gZW5xdWV1ZTtcbiAgfVxuXG4gIGRlZmluZUl0ZXJhdG9yTWV0aG9kcyhBc3luY0l0ZXJhdG9yLnByb3RvdHlwZSk7XG4gIEFzeW5jSXRlcmF0b3IucHJvdG90eXBlW2FzeW5jSXRlcmF0b3JTeW1ib2xdID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuICBleHBvcnRzLkFzeW5jSXRlcmF0b3IgPSBBc3luY0l0ZXJhdG9yO1xuXG4gIC8vIE5vdGUgdGhhdCBzaW1wbGUgYXN5bmMgZnVuY3Rpb25zIGFyZSBpbXBsZW1lbnRlZCBvbiB0b3Agb2ZcbiAgLy8gQXN5bmNJdGVyYXRvciBvYmplY3RzOyB0aGV5IGp1c3QgcmV0dXJuIGEgUHJvbWlzZSBmb3IgdGhlIHZhbHVlIG9mXG4gIC8vIHRoZSBmaW5hbCByZXN1bHQgcHJvZHVjZWQgYnkgdGhlIGl0ZXJhdG9yLlxuICBleHBvcnRzLmFzeW5jID0gZnVuY3Rpb24oaW5uZXJGbiwgb3V0ZXJGbiwgc2VsZiwgdHJ5TG9jc0xpc3QsIFByb21pc2VJbXBsKSB7XG4gICAgaWYgKFByb21pc2VJbXBsID09PSB2b2lkIDApIFByb21pc2VJbXBsID0gUHJvbWlzZTtcblxuICAgIHZhciBpdGVyID0gbmV3IEFzeW5jSXRlcmF0b3IoXG4gICAgICB3cmFwKGlubmVyRm4sIG91dGVyRm4sIHNlbGYsIHRyeUxvY3NMaXN0KSxcbiAgICAgIFByb21pc2VJbXBsXG4gICAgKTtcblxuICAgIHJldHVybiBleHBvcnRzLmlzR2VuZXJhdG9yRnVuY3Rpb24ob3V0ZXJGbilcbiAgICAgID8gaXRlciAvLyBJZiBvdXRlckZuIGlzIGEgZ2VuZXJhdG9yLCByZXR1cm4gdGhlIGZ1bGwgaXRlcmF0b3IuXG4gICAgICA6IGl0ZXIubmV4dCgpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdC5kb25lID8gcmVzdWx0LnZhbHVlIDogaXRlci5uZXh0KCk7XG4gICAgICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIG1ha2VJbnZva2VNZXRob2QoaW5uZXJGbiwgc2VsZiwgY29udGV4dCkge1xuICAgIHZhciBzdGF0ZSA9IEdlblN0YXRlU3VzcGVuZGVkU3RhcnQ7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gaW52b2tlKG1ldGhvZCwgYXJnKSB7XG4gICAgICBpZiAoc3RhdGUgPT09IEdlblN0YXRlRXhlY3V0aW5nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IHJ1bm5pbmdcIik7XG4gICAgICB9XG5cbiAgICAgIGlmIChzdGF0ZSA9PT0gR2VuU3RhdGVDb21wbGV0ZWQpIHtcbiAgICAgICAgaWYgKG1ldGhvZCA9PT0gXCJ0aHJvd1wiKSB7XG4gICAgICAgICAgdGhyb3cgYXJnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQmUgZm9yZ2l2aW5nLCBwZXIgMjUuMy4zLjMuMyBvZiB0aGUgc3BlYzpcbiAgICAgICAgLy8gaHR0cHM6Ly9wZW9wbGUubW96aWxsYS5vcmcvfmpvcmVuZG9yZmYvZXM2LWRyYWZ0Lmh0bWwjc2VjLWdlbmVyYXRvcnJlc3VtZVxuICAgICAgICByZXR1cm4gZG9uZVJlc3VsdCgpO1xuICAgICAgfVxuXG4gICAgICBjb250ZXh0Lm1ldGhvZCA9IG1ldGhvZDtcbiAgICAgIGNvbnRleHQuYXJnID0gYXJnO1xuXG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICB2YXIgZGVsZWdhdGUgPSBjb250ZXh0LmRlbGVnYXRlO1xuICAgICAgICBpZiAoZGVsZWdhdGUpIHtcbiAgICAgICAgICB2YXIgZGVsZWdhdGVSZXN1bHQgPSBtYXliZUludm9rZURlbGVnYXRlKGRlbGVnYXRlLCBjb250ZXh0KTtcbiAgICAgICAgICBpZiAoZGVsZWdhdGVSZXN1bHQpIHtcbiAgICAgICAgICAgIGlmIChkZWxlZ2F0ZVJlc3VsdCA9PT0gQ29udGludWVTZW50aW5lbCkgY29udGludWU7XG4gICAgICAgICAgICByZXR1cm4gZGVsZWdhdGVSZXN1bHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbnRleHQubWV0aG9kID09PSBcIm5leHRcIikge1xuICAgICAgICAgIC8vIFNldHRpbmcgY29udGV4dC5fc2VudCBmb3IgbGVnYWN5IHN1cHBvcnQgb2YgQmFiZWwnc1xuICAgICAgICAgIC8vIGZ1bmN0aW9uLnNlbnQgaW1wbGVtZW50YXRpb24uXG4gICAgICAgICAgY29udGV4dC5zZW50ID0gY29udGV4dC5fc2VudCA9IGNvbnRleHQuYXJnO1xuXG4gICAgICAgIH0gZWxzZSBpZiAoY29udGV4dC5tZXRob2QgPT09IFwidGhyb3dcIikge1xuICAgICAgICAgIGlmIChzdGF0ZSA9PT0gR2VuU3RhdGVTdXNwZW5kZWRTdGFydCkge1xuICAgICAgICAgICAgc3RhdGUgPSBHZW5TdGF0ZUNvbXBsZXRlZDtcbiAgICAgICAgICAgIHRocm93IGNvbnRleHQuYXJnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnRleHQuZGlzcGF0Y2hFeGNlcHRpb24oY29udGV4dC5hcmcpO1xuXG4gICAgICAgIH0gZWxzZSBpZiAoY29udGV4dC5tZXRob2QgPT09IFwicmV0dXJuXCIpIHtcbiAgICAgICAgICBjb250ZXh0LmFicnVwdChcInJldHVyblwiLCBjb250ZXh0LmFyZyk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0ZSA9IEdlblN0YXRlRXhlY3V0aW5nO1xuXG4gICAgICAgIHZhciByZWNvcmQgPSB0cnlDYXRjaChpbm5lckZuLCBzZWxmLCBjb250ZXh0KTtcbiAgICAgICAgaWYgKHJlY29yZC50eXBlID09PSBcIm5vcm1hbFwiKSB7XG4gICAgICAgICAgLy8gSWYgYW4gZXhjZXB0aW9uIGlzIHRocm93biBmcm9tIGlubmVyRm4sIHdlIGxlYXZlIHN0YXRlID09PVxuICAgICAgICAgIC8vIEdlblN0YXRlRXhlY3V0aW5nIGFuZCBsb29wIGJhY2sgZm9yIGFub3RoZXIgaW52b2NhdGlvbi5cbiAgICAgICAgICBzdGF0ZSA9IGNvbnRleHQuZG9uZVxuICAgICAgICAgICAgPyBHZW5TdGF0ZUNvbXBsZXRlZFxuICAgICAgICAgICAgOiBHZW5TdGF0ZVN1c3BlbmRlZFlpZWxkO1xuXG4gICAgICAgICAgaWYgKHJlY29yZC5hcmcgPT09IENvbnRpbnVlU2VudGluZWwpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB2YWx1ZTogcmVjb3JkLmFyZyxcbiAgICAgICAgICAgIGRvbmU6IGNvbnRleHQuZG9uZVxuICAgICAgICAgIH07XG5cbiAgICAgICAgfSBlbHNlIGlmIChyZWNvcmQudHlwZSA9PT0gXCJ0aHJvd1wiKSB7XG4gICAgICAgICAgc3RhdGUgPSBHZW5TdGF0ZUNvbXBsZXRlZDtcbiAgICAgICAgICAvLyBEaXNwYXRjaCB0aGUgZXhjZXB0aW9uIGJ5IGxvb3BpbmcgYmFjayBhcm91bmQgdG8gdGhlXG4gICAgICAgICAgLy8gY29udGV4dC5kaXNwYXRjaEV4Y2VwdGlvbihjb250ZXh0LmFyZykgY2FsbCBhYm92ZS5cbiAgICAgICAgICBjb250ZXh0Lm1ldGhvZCA9IFwidGhyb3dcIjtcbiAgICAgICAgICBjb250ZXh0LmFyZyA9IHJlY29yZC5hcmc7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gQ2FsbCBkZWxlZ2F0ZS5pdGVyYXRvcltjb250ZXh0Lm1ldGhvZF0oY29udGV4dC5hcmcpIGFuZCBoYW5kbGUgdGhlXG4gIC8vIHJlc3VsdCwgZWl0aGVyIGJ5IHJldHVybmluZyBhIHsgdmFsdWUsIGRvbmUgfSByZXN1bHQgZnJvbSB0aGVcbiAgLy8gZGVsZWdhdGUgaXRlcmF0b3IsIG9yIGJ5IG1vZGlmeWluZyBjb250ZXh0Lm1ldGhvZCBhbmQgY29udGV4dC5hcmcsXG4gIC8vIHNldHRpbmcgY29udGV4dC5kZWxlZ2F0ZSB0byBudWxsLCBhbmQgcmV0dXJuaW5nIHRoZSBDb250aW51ZVNlbnRpbmVsLlxuICBmdW5jdGlvbiBtYXliZUludm9rZURlbGVnYXRlKGRlbGVnYXRlLCBjb250ZXh0KSB7XG4gICAgdmFyIG1ldGhvZCA9IGRlbGVnYXRlLml0ZXJhdG9yW2NvbnRleHQubWV0aG9kXTtcbiAgICBpZiAobWV0aG9kID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIEEgLnRocm93IG9yIC5yZXR1cm4gd2hlbiB0aGUgZGVsZWdhdGUgaXRlcmF0b3IgaGFzIG5vIC50aHJvd1xuICAgICAgLy8gbWV0aG9kIGFsd2F5cyB0ZXJtaW5hdGVzIHRoZSB5aWVsZCogbG9vcC5cbiAgICAgIGNvbnRleHQuZGVsZWdhdGUgPSBudWxsO1xuXG4gICAgICBpZiAoY29udGV4dC5tZXRob2QgPT09IFwidGhyb3dcIikge1xuICAgICAgICAvLyBOb3RlOiBbXCJyZXR1cm5cIl0gbXVzdCBiZSB1c2VkIGZvciBFUzMgcGFyc2luZyBjb21wYXRpYmlsaXR5LlxuICAgICAgICBpZiAoZGVsZWdhdGUuaXRlcmF0b3JbXCJyZXR1cm5cIl0pIHtcbiAgICAgICAgICAvLyBJZiB0aGUgZGVsZWdhdGUgaXRlcmF0b3IgaGFzIGEgcmV0dXJuIG1ldGhvZCwgZ2l2ZSBpdCBhXG4gICAgICAgICAgLy8gY2hhbmNlIHRvIGNsZWFuIHVwLlxuICAgICAgICAgIGNvbnRleHQubWV0aG9kID0gXCJyZXR1cm5cIjtcbiAgICAgICAgICBjb250ZXh0LmFyZyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBtYXliZUludm9rZURlbGVnYXRlKGRlbGVnYXRlLCBjb250ZXh0KTtcblxuICAgICAgICAgIGlmIChjb250ZXh0Lm1ldGhvZCA9PT0gXCJ0aHJvd1wiKSB7XG4gICAgICAgICAgICAvLyBJZiBtYXliZUludm9rZURlbGVnYXRlKGNvbnRleHQpIGNoYW5nZWQgY29udGV4dC5tZXRob2QgZnJvbVxuICAgICAgICAgICAgLy8gXCJyZXR1cm5cIiB0byBcInRocm93XCIsIGxldCB0aGF0IG92ZXJyaWRlIHRoZSBUeXBlRXJyb3IgYmVsb3cuXG4gICAgICAgICAgICByZXR1cm4gQ29udGludWVTZW50aW5lbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb250ZXh0Lm1ldGhvZCA9IFwidGhyb3dcIjtcbiAgICAgICAgY29udGV4dC5hcmcgPSBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgIFwiVGhlIGl0ZXJhdG9yIGRvZXMgbm90IHByb3ZpZGUgYSAndGhyb3cnIG1ldGhvZFwiKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIENvbnRpbnVlU2VudGluZWw7XG4gICAgfVxuXG4gICAgdmFyIHJlY29yZCA9IHRyeUNhdGNoKG1ldGhvZCwgZGVsZWdhdGUuaXRlcmF0b3IsIGNvbnRleHQuYXJnKTtcblxuICAgIGlmIChyZWNvcmQudHlwZSA9PT0gXCJ0aHJvd1wiKSB7XG4gICAgICBjb250ZXh0Lm1ldGhvZCA9IFwidGhyb3dcIjtcbiAgICAgIGNvbnRleHQuYXJnID0gcmVjb3JkLmFyZztcbiAgICAgIGNvbnRleHQuZGVsZWdhdGUgPSBudWxsO1xuICAgICAgcmV0dXJuIENvbnRpbnVlU2VudGluZWw7XG4gICAgfVxuXG4gICAgdmFyIGluZm8gPSByZWNvcmQuYXJnO1xuXG4gICAgaWYgKCEgaW5mbykge1xuICAgICAgY29udGV4dC5tZXRob2QgPSBcInRocm93XCI7XG4gICAgICBjb250ZXh0LmFyZyA9IG5ldyBUeXBlRXJyb3IoXCJpdGVyYXRvciByZXN1bHQgaXMgbm90IGFuIG9iamVjdFwiKTtcbiAgICAgIGNvbnRleHQuZGVsZWdhdGUgPSBudWxsO1xuICAgICAgcmV0dXJuIENvbnRpbnVlU2VudGluZWw7XG4gICAgfVxuXG4gICAgaWYgKGluZm8uZG9uZSkge1xuICAgICAgLy8gQXNzaWduIHRoZSByZXN1bHQgb2YgdGhlIGZpbmlzaGVkIGRlbGVnYXRlIHRvIHRoZSB0ZW1wb3JhcnlcbiAgICAgIC8vIHZhcmlhYmxlIHNwZWNpZmllZCBieSBkZWxlZ2F0ZS5yZXN1bHROYW1lIChzZWUgZGVsZWdhdGVZaWVsZCkuXG4gICAgICBjb250ZXh0W2RlbGVnYXRlLnJlc3VsdE5hbWVdID0gaW5mby52YWx1ZTtcblxuICAgICAgLy8gUmVzdW1lIGV4ZWN1dGlvbiBhdCB0aGUgZGVzaXJlZCBsb2NhdGlvbiAoc2VlIGRlbGVnYXRlWWllbGQpLlxuICAgICAgY29udGV4dC5uZXh0ID0gZGVsZWdhdGUubmV4dExvYztcblxuICAgICAgLy8gSWYgY29udGV4dC5tZXRob2Qgd2FzIFwidGhyb3dcIiBidXQgdGhlIGRlbGVnYXRlIGhhbmRsZWQgdGhlXG4gICAgICAvLyBleGNlcHRpb24sIGxldCB0aGUgb3V0ZXIgZ2VuZXJhdG9yIHByb2NlZWQgbm9ybWFsbHkuIElmXG4gICAgICAvLyBjb250ZXh0Lm1ldGhvZCB3YXMgXCJuZXh0XCIsIGZvcmdldCBjb250ZXh0LmFyZyBzaW5jZSBpdCBoYXMgYmVlblxuICAgICAgLy8gXCJjb25zdW1lZFwiIGJ5IHRoZSBkZWxlZ2F0ZSBpdGVyYXRvci4gSWYgY29udGV4dC5tZXRob2Qgd2FzXG4gICAgICAvLyBcInJldHVyblwiLCBhbGxvdyB0aGUgb3JpZ2luYWwgLnJldHVybiBjYWxsIHRvIGNvbnRpbnVlIGluIHRoZVxuICAgICAgLy8gb3V0ZXIgZ2VuZXJhdG9yLlxuICAgICAgaWYgKGNvbnRleHQubWV0aG9kICE9PSBcInJldHVyblwiKSB7XG4gICAgICAgIGNvbnRleHQubWV0aG9kID0gXCJuZXh0XCI7XG4gICAgICAgIGNvbnRleHQuYXJnID0gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFJlLXlpZWxkIHRoZSByZXN1bHQgcmV0dXJuZWQgYnkgdGhlIGRlbGVnYXRlIG1ldGhvZC5cbiAgICAgIHJldHVybiBpbmZvO1xuICAgIH1cblxuICAgIC8vIFRoZSBkZWxlZ2F0ZSBpdGVyYXRvciBpcyBmaW5pc2hlZCwgc28gZm9yZ2V0IGl0IGFuZCBjb250aW51ZSB3aXRoXG4gICAgLy8gdGhlIG91dGVyIGdlbmVyYXRvci5cbiAgICBjb250ZXh0LmRlbGVnYXRlID0gbnVsbDtcbiAgICByZXR1cm4gQ29udGludWVTZW50aW5lbDtcbiAgfVxuXG4gIC8vIERlZmluZSBHZW5lcmF0b3IucHJvdG90eXBlLntuZXh0LHRocm93LHJldHVybn0gaW4gdGVybXMgb2YgdGhlXG4gIC8vIHVuaWZpZWQgLl9pbnZva2UgaGVscGVyIG1ldGhvZC5cbiAgZGVmaW5lSXRlcmF0b3JNZXRob2RzKEdwKTtcblxuICBkZWZpbmUoR3AsIHRvU3RyaW5nVGFnU3ltYm9sLCBcIkdlbmVyYXRvclwiKTtcblxuICAvLyBBIEdlbmVyYXRvciBzaG91bGQgYWx3YXlzIHJldHVybiBpdHNlbGYgYXMgdGhlIGl0ZXJhdG9yIG9iamVjdCB3aGVuIHRoZVxuICAvLyBAQGl0ZXJhdG9yIGZ1bmN0aW9uIGlzIGNhbGxlZCBvbiBpdC4gU29tZSBicm93c2VycycgaW1wbGVtZW50YXRpb25zIG9mIHRoZVxuICAvLyBpdGVyYXRvciBwcm90b3R5cGUgY2hhaW4gaW5jb3JyZWN0bHkgaW1wbGVtZW50IHRoaXMsIGNhdXNpbmcgdGhlIEdlbmVyYXRvclxuICAvLyBvYmplY3QgdG8gbm90IGJlIHJldHVybmVkIGZyb20gdGhpcyBjYWxsLiBUaGlzIGVuc3VyZXMgdGhhdCBkb2Vzbid0IGhhcHBlbi5cbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWdlbmVyYXRvci9pc3N1ZXMvMjc0IGZvciBtb3JlIGRldGFpbHMuXG4gIEdwW2l0ZXJhdG9yU3ltYm9sXSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIEdwLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIFwiW29iamVjdCBHZW5lcmF0b3JdXCI7XG4gIH07XG5cbiAgZnVuY3Rpb24gcHVzaFRyeUVudHJ5KGxvY3MpIHtcbiAgICB2YXIgZW50cnkgPSB7IHRyeUxvYzogbG9jc1swXSB9O1xuXG4gICAgaWYgKDEgaW4gbG9jcykge1xuICAgICAgZW50cnkuY2F0Y2hMb2MgPSBsb2NzWzFdO1xuICAgIH1cblxuICAgIGlmICgyIGluIGxvY3MpIHtcbiAgICAgIGVudHJ5LmZpbmFsbHlMb2MgPSBsb2NzWzJdO1xuICAgICAgZW50cnkuYWZ0ZXJMb2MgPSBsb2NzWzNdO1xuICAgIH1cblxuICAgIHRoaXMudHJ5RW50cmllcy5wdXNoKGVudHJ5KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc2V0VHJ5RW50cnkoZW50cnkpIHtcbiAgICB2YXIgcmVjb3JkID0gZW50cnkuY29tcGxldGlvbiB8fCB7fTtcbiAgICByZWNvcmQudHlwZSA9IFwibm9ybWFsXCI7XG4gICAgZGVsZXRlIHJlY29yZC5hcmc7XG4gICAgZW50cnkuY29tcGxldGlvbiA9IHJlY29yZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIENvbnRleHQodHJ5TG9jc0xpc3QpIHtcbiAgICAvLyBUaGUgcm9vdCBlbnRyeSBvYmplY3QgKGVmZmVjdGl2ZWx5IGEgdHJ5IHN0YXRlbWVudCB3aXRob3V0IGEgY2F0Y2hcbiAgICAvLyBvciBhIGZpbmFsbHkgYmxvY2spIGdpdmVzIHVzIGEgcGxhY2UgdG8gc3RvcmUgdmFsdWVzIHRocm93biBmcm9tXG4gICAgLy8gbG9jYXRpb25zIHdoZXJlIHRoZXJlIGlzIG5vIGVuY2xvc2luZyB0cnkgc3RhdGVtZW50LlxuICAgIHRoaXMudHJ5RW50cmllcyA9IFt7IHRyeUxvYzogXCJyb290XCIgfV07XG4gICAgdHJ5TG9jc0xpc3QuZm9yRWFjaChwdXNoVHJ5RW50cnksIHRoaXMpO1xuICAgIHRoaXMucmVzZXQodHJ1ZSk7XG4gIH1cblxuICBleHBvcnRzLmtleXMgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgIGtleXMucHVzaChrZXkpO1xuICAgIH1cbiAgICBrZXlzLnJldmVyc2UoKTtcblxuICAgIC8vIFJhdGhlciB0aGFuIHJldHVybmluZyBhbiBvYmplY3Qgd2l0aCBhIG5leHQgbWV0aG9kLCB3ZSBrZWVwXG4gICAgLy8gdGhpbmdzIHNpbXBsZSBhbmQgcmV0dXJuIHRoZSBuZXh0IGZ1bmN0aW9uIGl0c2VsZi5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgIHdoaWxlIChrZXlzLmxlbmd0aCkge1xuICAgICAgICB2YXIga2V5ID0ga2V5cy5wb3AoKTtcbiAgICAgICAgaWYgKGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgICBuZXh0LnZhbHVlID0ga2V5O1xuICAgICAgICAgIG5leHQuZG9uZSA9IGZhbHNlO1xuICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFRvIGF2b2lkIGNyZWF0aW5nIGFuIGFkZGl0aW9uYWwgb2JqZWN0LCB3ZSBqdXN0IGhhbmcgdGhlIC52YWx1ZVxuICAgICAgLy8gYW5kIC5kb25lIHByb3BlcnRpZXMgb2ZmIHRoZSBuZXh0IGZ1bmN0aW9uIG9iamVjdCBpdHNlbGYuIFRoaXNcbiAgICAgIC8vIGFsc28gZW5zdXJlcyB0aGF0IHRoZSBtaW5pZmllciB3aWxsIG5vdCBhbm9ueW1pemUgdGhlIGZ1bmN0aW9uLlxuICAgICAgbmV4dC5kb25lID0gdHJ1ZTtcbiAgICAgIHJldHVybiBuZXh0O1xuICAgIH07XG4gIH07XG5cbiAgZnVuY3Rpb24gdmFsdWVzKGl0ZXJhYmxlKSB7XG4gICAgaWYgKGl0ZXJhYmxlKSB7XG4gICAgICB2YXIgaXRlcmF0b3JNZXRob2QgPSBpdGVyYWJsZVtpdGVyYXRvclN5bWJvbF07XG4gICAgICBpZiAoaXRlcmF0b3JNZXRob2QpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yTWV0aG9kLmNhbGwoaXRlcmFibGUpO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIGl0ZXJhYmxlLm5leHQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gaXRlcmFibGU7XG4gICAgICB9XG5cbiAgICAgIGlmICghaXNOYU4oaXRlcmFibGUubGVuZ3RoKSkge1xuICAgICAgICB2YXIgaSA9IC0xLCBuZXh0ID0gZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgICB3aGlsZSAoKytpIDwgaXRlcmFibGUubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duLmNhbGwoaXRlcmFibGUsIGkpKSB7XG4gICAgICAgICAgICAgIG5leHQudmFsdWUgPSBpdGVyYWJsZVtpXTtcbiAgICAgICAgICAgICAgbmV4dC5kb25lID0gZmFsc2U7XG4gICAgICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIG5leHQudmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgbmV4dC5kb25lID0gdHJ1ZTtcblxuICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBuZXh0Lm5leHQgPSBuZXh0O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJldHVybiBhbiBpdGVyYXRvciB3aXRoIG5vIHZhbHVlcy5cbiAgICByZXR1cm4geyBuZXh0OiBkb25lUmVzdWx0IH07XG4gIH1cbiAgZXhwb3J0cy52YWx1ZXMgPSB2YWx1ZXM7XG5cbiAgZnVuY3Rpb24gZG9uZVJlc3VsdCgpIHtcbiAgICByZXR1cm4geyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH07XG4gIH1cblxuICBDb250ZXh0LnByb3RvdHlwZSA9IHtcbiAgICBjb25zdHJ1Y3RvcjogQ29udGV4dCxcblxuICAgIHJlc2V0OiBmdW5jdGlvbihza2lwVGVtcFJlc2V0KSB7XG4gICAgICB0aGlzLnByZXYgPSAwO1xuICAgICAgdGhpcy5uZXh0ID0gMDtcbiAgICAgIC8vIFJlc2V0dGluZyBjb250ZXh0Ll9zZW50IGZvciBsZWdhY3kgc3VwcG9ydCBvZiBCYWJlbCdzXG4gICAgICAvLyBmdW5jdGlvbi5zZW50IGltcGxlbWVudGF0aW9uLlxuICAgICAgdGhpcy5zZW50ID0gdGhpcy5fc2VudCA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuZG9uZSA9IGZhbHNlO1xuICAgICAgdGhpcy5kZWxlZ2F0ZSA9IG51bGw7XG5cbiAgICAgIHRoaXMubWV0aG9kID0gXCJuZXh0XCI7XG4gICAgICB0aGlzLmFyZyA9IHVuZGVmaW5lZDtcblxuICAgICAgdGhpcy50cnlFbnRyaWVzLmZvckVhY2gocmVzZXRUcnlFbnRyeSk7XG5cbiAgICAgIGlmICghc2tpcFRlbXBSZXNldCkge1xuICAgICAgICBmb3IgKHZhciBuYW1lIGluIHRoaXMpIHtcbiAgICAgICAgICAvLyBOb3Qgc3VyZSBhYm91dCB0aGUgb3B0aW1hbCBvcmRlciBvZiB0aGVzZSBjb25kaXRpb25zOlxuICAgICAgICAgIGlmIChuYW1lLmNoYXJBdCgwKSA9PT0gXCJ0XCIgJiZcbiAgICAgICAgICAgICAgaGFzT3duLmNhbGwodGhpcywgbmFtZSkgJiZcbiAgICAgICAgICAgICAgIWlzTmFOKCtuYW1lLnNsaWNlKDEpKSkge1xuICAgICAgICAgICAgdGhpc1tuYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgc3RvcDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmRvbmUgPSB0cnVlO1xuXG4gICAgICB2YXIgcm9vdEVudHJ5ID0gdGhpcy50cnlFbnRyaWVzWzBdO1xuICAgICAgdmFyIHJvb3RSZWNvcmQgPSByb290RW50cnkuY29tcGxldGlvbjtcbiAgICAgIGlmIChyb290UmVjb3JkLnR5cGUgPT09IFwidGhyb3dcIikge1xuICAgICAgICB0aHJvdyByb290UmVjb3JkLmFyZztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMucnZhbDtcbiAgICB9LFxuXG4gICAgZGlzcGF0Y2hFeGNlcHRpb246IGZ1bmN0aW9uKGV4Y2VwdGlvbikge1xuICAgICAgaWYgKHRoaXMuZG9uZSkge1xuICAgICAgICB0aHJvdyBleGNlcHRpb247XG4gICAgICB9XG5cbiAgICAgIHZhciBjb250ZXh0ID0gdGhpcztcbiAgICAgIGZ1bmN0aW9uIGhhbmRsZShsb2MsIGNhdWdodCkge1xuICAgICAgICByZWNvcmQudHlwZSA9IFwidGhyb3dcIjtcbiAgICAgICAgcmVjb3JkLmFyZyA9IGV4Y2VwdGlvbjtcbiAgICAgICAgY29udGV4dC5uZXh0ID0gbG9jO1xuXG4gICAgICAgIGlmIChjYXVnaHQpIHtcbiAgICAgICAgICAvLyBJZiB0aGUgZGlzcGF0Y2hlZCBleGNlcHRpb24gd2FzIGNhdWdodCBieSBhIGNhdGNoIGJsb2NrLFxuICAgICAgICAgIC8vIHRoZW4gbGV0IHRoYXQgY2F0Y2ggYmxvY2sgaGFuZGxlIHRoZSBleGNlcHRpb24gbm9ybWFsbHkuXG4gICAgICAgICAgY29udGV4dC5tZXRob2QgPSBcIm5leHRcIjtcbiAgICAgICAgICBjb250ZXh0LmFyZyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAhISBjYXVnaHQ7XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSB0aGlzLnRyeUVudHJpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gdGhpcy50cnlFbnRyaWVzW2ldO1xuICAgICAgICB2YXIgcmVjb3JkID0gZW50cnkuY29tcGxldGlvbjtcblxuICAgICAgICBpZiAoZW50cnkudHJ5TG9jID09PSBcInJvb3RcIikge1xuICAgICAgICAgIC8vIEV4Y2VwdGlvbiB0aHJvd24gb3V0c2lkZSBvZiBhbnkgdHJ5IGJsb2NrIHRoYXQgY291bGQgaGFuZGxlXG4gICAgICAgICAgLy8gaXQsIHNvIHNldCB0aGUgY29tcGxldGlvbiB2YWx1ZSBvZiB0aGUgZW50aXJlIGZ1bmN0aW9uIHRvXG4gICAgICAgICAgLy8gdGhyb3cgdGhlIGV4Y2VwdGlvbi5cbiAgICAgICAgICByZXR1cm4gaGFuZGxlKFwiZW5kXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVudHJ5LnRyeUxvYyA8PSB0aGlzLnByZXYpIHtcbiAgICAgICAgICB2YXIgaGFzQ2F0Y2ggPSBoYXNPd24uY2FsbChlbnRyeSwgXCJjYXRjaExvY1wiKTtcbiAgICAgICAgICB2YXIgaGFzRmluYWxseSA9IGhhc093bi5jYWxsKGVudHJ5LCBcImZpbmFsbHlMb2NcIik7XG5cbiAgICAgICAgICBpZiAoaGFzQ2F0Y2ggJiYgaGFzRmluYWxseSkge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJldiA8IGVudHJ5LmNhdGNoTG9jKSB7XG4gICAgICAgICAgICAgIHJldHVybiBoYW5kbGUoZW50cnkuY2F0Y2hMb2MsIHRydWUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnByZXYgPCBlbnRyeS5maW5hbGx5TG9jKSB7XG4gICAgICAgICAgICAgIHJldHVybiBoYW5kbGUoZW50cnkuZmluYWxseUxvYyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9IGVsc2UgaWYgKGhhc0NhdGNoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2IDwgZW50cnkuY2F0Y2hMb2MpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZShlbnRyeS5jYXRjaExvYywgdHJ1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9IGVsc2UgaWYgKGhhc0ZpbmFsbHkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXYgPCBlbnRyeS5maW5hbGx5TG9jKSB7XG4gICAgICAgICAgICAgIHJldHVybiBoYW5kbGUoZW50cnkuZmluYWxseUxvYyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidHJ5IHN0YXRlbWVudCB3aXRob3V0IGNhdGNoIG9yIGZpbmFsbHlcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIGFicnVwdDogZnVuY3Rpb24odHlwZSwgYXJnKSB7XG4gICAgICBmb3IgKHZhciBpID0gdGhpcy50cnlFbnRyaWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIHZhciBlbnRyeSA9IHRoaXMudHJ5RW50cmllc1tpXTtcbiAgICAgICAgaWYgKGVudHJ5LnRyeUxvYyA8PSB0aGlzLnByZXYgJiZcbiAgICAgICAgICAgIGhhc093bi5jYWxsKGVudHJ5LCBcImZpbmFsbHlMb2NcIikgJiZcbiAgICAgICAgICAgIHRoaXMucHJldiA8IGVudHJ5LmZpbmFsbHlMb2MpIHtcbiAgICAgICAgICB2YXIgZmluYWxseUVudHJ5ID0gZW50cnk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGZpbmFsbHlFbnRyeSAmJlxuICAgICAgICAgICh0eXBlID09PSBcImJyZWFrXCIgfHxcbiAgICAgICAgICAgdHlwZSA9PT0gXCJjb250aW51ZVwiKSAmJlxuICAgICAgICAgIGZpbmFsbHlFbnRyeS50cnlMb2MgPD0gYXJnICYmXG4gICAgICAgICAgYXJnIDw9IGZpbmFsbHlFbnRyeS5maW5hbGx5TG9jKSB7XG4gICAgICAgIC8vIElnbm9yZSB0aGUgZmluYWxseSBlbnRyeSBpZiBjb250cm9sIGlzIG5vdCBqdW1waW5nIHRvIGFcbiAgICAgICAgLy8gbG9jYXRpb24gb3V0c2lkZSB0aGUgdHJ5L2NhdGNoIGJsb2NrLlxuICAgICAgICBmaW5hbGx5RW50cnkgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICB2YXIgcmVjb3JkID0gZmluYWxseUVudHJ5ID8gZmluYWxseUVudHJ5LmNvbXBsZXRpb24gOiB7fTtcbiAgICAgIHJlY29yZC50eXBlID0gdHlwZTtcbiAgICAgIHJlY29yZC5hcmcgPSBhcmc7XG5cbiAgICAgIGlmIChmaW5hbGx5RW50cnkpIHtcbiAgICAgICAgdGhpcy5tZXRob2QgPSBcIm5leHRcIjtcbiAgICAgICAgdGhpcy5uZXh0ID0gZmluYWxseUVudHJ5LmZpbmFsbHlMb2M7XG4gICAgICAgIHJldHVybiBDb250aW51ZVNlbnRpbmVsO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5jb21wbGV0ZShyZWNvcmQpO1xuICAgIH0sXG5cbiAgICBjb21wbGV0ZTogZnVuY3Rpb24ocmVjb3JkLCBhZnRlckxvYykge1xuICAgICAgaWYgKHJlY29yZC50eXBlID09PSBcInRocm93XCIpIHtcbiAgICAgICAgdGhyb3cgcmVjb3JkLmFyZztcbiAgICAgIH1cblxuICAgICAgaWYgKHJlY29yZC50eXBlID09PSBcImJyZWFrXCIgfHxcbiAgICAgICAgICByZWNvcmQudHlwZSA9PT0gXCJjb250aW51ZVwiKSB7XG4gICAgICAgIHRoaXMubmV4dCA9IHJlY29yZC5hcmc7XG4gICAgICB9IGVsc2UgaWYgKHJlY29yZC50eXBlID09PSBcInJldHVyblwiKSB7XG4gICAgICAgIHRoaXMucnZhbCA9IHRoaXMuYXJnID0gcmVjb3JkLmFyZztcbiAgICAgICAgdGhpcy5tZXRob2QgPSBcInJldHVyblwiO1xuICAgICAgICB0aGlzLm5leHQgPSBcImVuZFwiO1xuICAgICAgfSBlbHNlIGlmIChyZWNvcmQudHlwZSA9PT0gXCJub3JtYWxcIiAmJiBhZnRlckxvYykge1xuICAgICAgICB0aGlzLm5leHQgPSBhZnRlckxvYztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIENvbnRpbnVlU2VudGluZWw7XG4gICAgfSxcblxuICAgIGZpbmlzaDogZnVuY3Rpb24oZmluYWxseUxvYykge1xuICAgICAgZm9yICh2YXIgaSA9IHRoaXMudHJ5RW50cmllcy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICB2YXIgZW50cnkgPSB0aGlzLnRyeUVudHJpZXNbaV07XG4gICAgICAgIGlmIChlbnRyeS5maW5hbGx5TG9jID09PSBmaW5hbGx5TG9jKSB7XG4gICAgICAgICAgdGhpcy5jb21wbGV0ZShlbnRyeS5jb21wbGV0aW9uLCBlbnRyeS5hZnRlckxvYyk7XG4gICAgICAgICAgcmVzZXRUcnlFbnRyeShlbnRyeSk7XG4gICAgICAgICAgcmV0dXJuIENvbnRpbnVlU2VudGluZWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgXCJjYXRjaFwiOiBmdW5jdGlvbih0cnlMb2MpIHtcbiAgICAgIGZvciAodmFyIGkgPSB0aGlzLnRyeUVudHJpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gdGhpcy50cnlFbnRyaWVzW2ldO1xuICAgICAgICBpZiAoZW50cnkudHJ5TG9jID09PSB0cnlMb2MpIHtcbiAgICAgICAgICB2YXIgcmVjb3JkID0gZW50cnkuY29tcGxldGlvbjtcbiAgICAgICAgICBpZiAocmVjb3JkLnR5cGUgPT09IFwidGhyb3dcIikge1xuICAgICAgICAgICAgdmFyIHRocm93biA9IHJlY29yZC5hcmc7XG4gICAgICAgICAgICByZXNldFRyeUVudHJ5KGVudHJ5KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRocm93bjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUaGUgY29udGV4dC5jYXRjaCBtZXRob2QgbXVzdCBvbmx5IGJlIGNhbGxlZCB3aXRoIGEgbG9jYXRpb25cbiAgICAgIC8vIGFyZ3VtZW50IHRoYXQgY29ycmVzcG9uZHMgdG8gYSBrbm93biBjYXRjaCBibG9jay5cbiAgICAgIHRocm93IG5ldyBFcnJvcihcImlsbGVnYWwgY2F0Y2ggYXR0ZW1wdFwiKTtcbiAgICB9LFxuXG4gICAgZGVsZWdhdGVZaWVsZDogZnVuY3Rpb24oaXRlcmFibGUsIHJlc3VsdE5hbWUsIG5leHRMb2MpIHtcbiAgICAgIHRoaXMuZGVsZWdhdGUgPSB7XG4gICAgICAgIGl0ZXJhdG9yOiB2YWx1ZXMoaXRlcmFibGUpLFxuICAgICAgICByZXN1bHROYW1lOiByZXN1bHROYW1lLFxuICAgICAgICBuZXh0TG9jOiBuZXh0TG9jXG4gICAgICB9O1xuXG4gICAgICBpZiAodGhpcy5tZXRob2QgPT09IFwibmV4dFwiKSB7XG4gICAgICAgIC8vIERlbGliZXJhdGVseSBmb3JnZXQgdGhlIGxhc3Qgc2VudCB2YWx1ZSBzbyB0aGF0IHdlIGRvbid0XG4gICAgICAgIC8vIGFjY2lkZW50YWxseSBwYXNzIGl0IG9uIHRvIHRoZSBkZWxlZ2F0ZS5cbiAgICAgICAgdGhpcy5hcmcgPSB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBDb250aW51ZVNlbnRpbmVsO1xuICAgIH1cbiAgfTtcblxuICAvLyBSZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhpcyBzY3JpcHQgaXMgZXhlY3V0aW5nIGFzIGEgQ29tbW9uSlMgbW9kdWxlXG4gIC8vIG9yIG5vdCwgcmV0dXJuIHRoZSBydW50aW1lIG9iamVjdCBzbyB0aGF0IHdlIGNhbiBkZWNsYXJlIHRoZSB2YXJpYWJsZVxuICAvLyByZWdlbmVyYXRvclJ1bnRpbWUgaW4gdGhlIG91dGVyIHNjb3BlLCB3aGljaCBhbGxvd3MgdGhpcyBtb2R1bGUgdG8gYmVcbiAgLy8gaW5qZWN0ZWQgZWFzaWx5IGJ5IGBiaW4vcmVnZW5lcmF0b3IgLS1pbmNsdWRlLXJ1bnRpbWUgc2NyaXB0LmpzYC5cbiAgcmV0dXJuIGV4cG9ydHM7XG5cbn0oXG4gIC8vIElmIHRoaXMgc2NyaXB0IGlzIGV4ZWN1dGluZyBhcyBhIENvbW1vbkpTIG1vZHVsZSwgdXNlIG1vZHVsZS5leHBvcnRzXG4gIC8vIGFzIHRoZSByZWdlbmVyYXRvclJ1bnRpbWUgbmFtZXNwYWNlLiBPdGhlcndpc2UgY3JlYXRlIGEgbmV3IGVtcHR5XG4gIC8vIG9iamVjdC4gRWl0aGVyIHdheSwgdGhlIHJlc3VsdGluZyBvYmplY3Qgd2lsbCBiZSB1c2VkIHRvIGluaXRpYWxpemVcbiAgLy8gdGhlIHJlZ2VuZXJhdG9yUnVudGltZSB2YXJpYWJsZSBhdCB0aGUgdG9wIG9mIHRoaXMgZmlsZS5cbiAgdHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIiA/IG1vZHVsZS5leHBvcnRzIDoge31cbikpO1xuXG50cnkge1xuICByZWdlbmVyYXRvclJ1bnRpbWUgPSBydW50aW1lO1xufSBjYXRjaCAoYWNjaWRlbnRhbFN0cmljdE1vZGUpIHtcbiAgLy8gVGhpcyBtb2R1bGUgc2hvdWxkIG5vdCBiZSBydW5uaW5nIGluIHN0cmljdCBtb2RlLCBzbyB0aGUgYWJvdmVcbiAgLy8gYXNzaWdubWVudCBzaG91bGQgYWx3YXlzIHdvcmsgdW5sZXNzIHNvbWV0aGluZyBpcyBtaXNjb25maWd1cmVkLiBKdXN0XG4gIC8vIGluIGNhc2UgcnVudGltZS5qcyBhY2NpZGVudGFsbHkgcnVucyBpbiBzdHJpY3QgbW9kZSwgd2UgY2FuIGVzY2FwZVxuICAvLyBzdHJpY3QgbW9kZSB1c2luZyBhIGdsb2JhbCBGdW5jdGlvbiBjYWxsLiBUaGlzIGNvdWxkIGNvbmNlaXZhYmx5IGZhaWxcbiAgLy8gaWYgYSBDb250ZW50IFNlY3VyaXR5IFBvbGljeSBmb3JiaWRzIHVzaW5nIEZ1bmN0aW9uLCBidXQgaW4gdGhhdCBjYXNlXG4gIC8vIHRoZSBwcm9wZXIgc29sdXRpb24gaXMgdG8gZml4IHRoZSBhY2NpZGVudGFsIHN0cmljdCBtb2RlIHByb2JsZW0uIElmXG4gIC8vIHlvdSd2ZSBtaXNjb25maWd1cmVkIHlvdXIgYnVuZGxlciB0byBmb3JjZSBzdHJpY3QgbW9kZSBhbmQgYXBwbGllZCBhXG4gIC8vIENTUCB0byBmb3JiaWQgRnVuY3Rpb24sIGFuZCB5b3UncmUgbm90IHdpbGxpbmcgdG8gZml4IGVpdGhlciBvZiB0aG9zZVxuICAvLyBwcm9ibGVtcywgcGxlYXNlIGRldGFpbCB5b3VyIHVuaXF1ZSBwcmVkaWNhbWVudCBpbiBhIEdpdEh1YiBpc3N1ZS5cbiAgRnVuY3Rpb24oXCJyXCIsIFwicmVnZW5lcmF0b3JSdW50aW1lID0gclwiKShydW50aW1lKTtcbn1cbiIsIlwidXNlIHN0cmljdFwiXHJcblxyXG5jbGFzcyBBYnN0cmFjdFZpZXd7XHJcbiAgICBjb25zdHJ1Y3Rvcigpe1xyXG4gICAgICAgIHRoaXMuRE9NID0ge307XHJcblxyXG4gICAgICAgIHRoaXMuRE9NLmdhbWVCb2FyZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJnYW1lLWJvYXJkXCIpO1xyXG4gICAgICAgIHRoaXMuRE9NLnF1ZXN0aW9uUGFnZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGV4dC1xdWVzdGlvblwiKTtcclxuICAgICAgICB0aGlzLkRPTS5xdWVzdGlvblRleHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RleHQtY29udGVudHNcIik7XHJcbiAgICAgICAgdGhpcy5ET00uYnV0dG9ucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYnV0dG9uc1wiKTtcclxuXHJcbiAgICAgICAgdGhpcy5ET00uYnV6emVyX2J1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYnV6elwiKTtcclxuICAgICAgICB0aGlzLkRPTS5hY2NlcHRfYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhY2NlcHRfYW5zd2VyXCIpO1xyXG4gICAgICAgIHRoaXMuRE9NLnJlamVjdF9idXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3JlamVjdF9hbnN3ZXJcIik7XHJcbiAgICAgICAgdGhpcy5ET00uc3RhcnRfdGltZXJfYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdGFydF90aW1lclwiKTtcclxuICAgICAgICB0aGlzLkRPTS50aW1lX291dF9idXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RpbWVfb3V0XCIpO1xyXG4gICAgICAgIHRoaXMuRE9NLmNvbnRpbnVlX2J1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29udGludWVcIik7XHJcbiAgICAgICAgdGhpcy5ET00uYmFja19idXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2JhY2tcIik7XHJcblxyXG4gICAgICAgIHRoaXMuRE9NLnBsYXlpbmdfaW5kaWNhdG9yID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNwbGF5aW5nXCIpO1xyXG4gICAgICAgIHRoaXMuRE9NLmNsb2NrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjbG9ja1wiKTtcclxuXHJcbiAgICAgICAgdGhpcy5ET00ubWVudUluZGljYXRvciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbWVudS1pbmRpY2F0b3JcIik7XHJcbiAgICAgICAgdGhpcy5ET00ubWVudUFyZWEgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI21lbnUtYXJlYVwiKTtcclxuICAgICAgICB0aGlzLkRPTS5tZW51TG9nb3V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNtZW51LWxvZ291dFwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5hc3NlcnRET00oKTtcclxuICAgICAgICAvLyB0aGlzLnNldHVwTWVudSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzc2VydERPTSgpe1xyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLkRPTSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuYXNzZXJ0KHRoaXMuRE9NW2tleV0gIT09IHVuZGVmaW5lZCwga2V5KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlTW9kZWwodXBkYXRlKXtcclxuICAgICAgICBzd2l0Y2ggKHVwZGF0ZS5zdGF0ZSl7XHJcbiAgICAgICAgICAgIGNhc2UgMDpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDQ6XHJcbiAgICAgICAgICAgICAgICB0aGlzLkRPTS5nYW1lQm9hcmQuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5maWxsSmVvcGFyZHlDYXRlZ29yaWVzKHVwZGF0ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGxKZW9wYXJkeUNlbGxzKHVwZGF0ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSA1OlxyXG4gICAgICAgICAgICAgICAgdGhpcy5ET00uZ2FtZUJvYXJkLnNob3coKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmlsbEplb3BhcmR5Q2F0ZWdvcmllcyh1cGRhdGUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5maWxsSmVvcGFyZHlDZWxscyh1cGRhdGUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgNjpcclxuICAgICAgICAgICAgICAgIHRoaXMuRE9NLmdhbWVCb2FyZC5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGxKZW9wYXJkeUNhdGVnb3JpZXModXBkYXRlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmlsbEplb3BhcmR5Q2VsbHModXBkYXRlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLkRPTS5nYW1lQm9hcmQuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5maWxsSmVvcGFyZHlDYXRlZ29yaWVzKHVwZGF0ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGxKZW9wYXJkeUNlbGxzKHVwZGF0ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSA4OlxyXG4gICAgICAgICAgICAgICAgdGhpcy5ET00uZ2FtZUJvYXJkLnNob3coKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmlsbEplb3BhcmR5Q2F0ZWdvcmllcyh1cGRhdGUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5maWxsSmVvcGFyZHlDZWxscyh1cGRhdGUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgOTpcclxuICAgICAgICAgICAgICAgIHRoaXMuRE9NLmdhbWVCb2FyZC5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGxKZW9wYXJkeUNhdGVnb3JpZXModXBkYXRlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmlsbEplb3BhcmR5Q2VsbHModXBkYXRlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZpbGxKZW9wYXJkeUNhdGVnb3JpZXModXBkYXRlKXtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDY7IGkrKyl7XHJcbiAgICAgICAgICAgIGxldCBjYXRlZ29yeSA9IHVwZGF0ZS5tb2RlbC5yb3VuZC5jYXRlZ29yaWVzW2ldO1xyXG4gICAgICAgICAgICB0aGlzLkRPTS5nYW1lQm9hcmQuc2V0SGVhZGVyKGksIGNhdGVnb3J5W1widGV4dFwiXSwgY2F0ZWdvcnlbXCJmb250LXNpemVcIl0sIHRydWUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZpbGxKZW9wYXJkeUNlbGxzKHVwZGF0ZSl7XHJcbiAgICAgICAgbGV0IHJvdW5kID0gdXBkYXRlLm1vZGVsLnJvdW5kO1xyXG4gICAgICAgIGZvciAobGV0IGMgPSAwOyBjIDwgNjsgYysrKXtcclxuICAgICAgICAgICAgZm9yIChsZXQgciA9IDA7IHIgPCA1OyByKyspe1xyXG4gICAgICAgICAgICAgICAgaWYgKHJvdW5kLnNwZW50W2NdW3JdKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuRE9NLmdhbWVCb2FyZC5zZXRDZWxsKHIsIGMsIHJvdW5kLnZhbHVlc1tjXVtyXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFic3RyYWN0VmlldzsiLCJcclxuY2xhc3MgSG9zdENvbnRyb2xsZXJ7XHJcblxyXG4gICAgY29uc3RydWN0b3Iod3MsIHZpZXcpIHtcclxuICAgICAgICB0aGlzLndzID0gd3M7XHJcbiAgICAgICAgdGhpcy52aWV3ID0gdmlldztcclxuXHJcbiAgICAgICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50KSA9PiB0aGlzLnByb2Nlc3MoSlNPTi5wYXJzZShldmVudC5kYXRhKSkpO1xyXG4gICAgICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcignY2xvc2UnLCAoZXZlbnQpID0+IHRoaXMub25DbG9zZShldmVudCkpO1xyXG5cclxuICAgICAgICB3aW5kb3cuc3RhcnQgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB0aGlzLnNlbmQoe2FjdGlvbiA6IFwic3RhcnRcIn0pO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBvblVwZGF0ZSgpe1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzKG1lc3NhZ2Upe1xyXG4gICAgICAgIGlmIChtZXNzYWdlLmFjdGlvbiAhPT0gXCJwaW5nXCIpIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xyXG4gICAgICAgIHN3aXRjaCAobWVzc2FnZS5hY3Rpb24pIHtcclxuICAgICAgICAgICAgY2FzZSBcImNvbm5lY3Rpb25fZXN0YWJsaXNoZWRcIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VuZCh7YWN0aW9uIDogXCJyZXF1ZXN0X21vZGVsXCJ9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwidXBkYXRlX21vZGVsXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXcudXBkYXRlTW9kZWwobWVzc2FnZS5kYXRhKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvbkNsb3NlKGV2ZW50KXtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2VuZChtc2cpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBzZW5kOiAke0pTT04uc3RyaW5naWZ5KG1zZyl9YCk7XHJcbiAgICAgICAgdGhpcy53cy5zZW5kKEpTT04uc3RyaW5naWZ5KG1zZykpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBIb3N0Q29udHJvbGxlcjsiLCJpbXBvcnQgQWJzdHJhY3RWaWV3IGZyb20gXCIuL0Fic3RyYWN0Vmlldy5qc1wiXHJcblxyXG5jbGFzcyBIb3N0VmlldyBleHRlbmRzIEFic3RyYWN0Vmlld3tcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuRE9NLmNvbnRpbnVlQnV0dG9uID0gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJnYW1lLWJvYXJkXCIpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICB1cGRhdGVNb2RlbCh1cGRhdGUpIHtcclxuICAgICAgICBzdXBlci51cGRhdGVNb2RlbCh1cGRhdGUpO1xyXG4gICAgICAgIHN3aXRjaCAodXBkYXRlLnN0YXRlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgMDpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDQ6XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSA1OlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgNjpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDc6XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSA4OlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgOTpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBIb3N0VmlldzsiLCJpbXBvcnQgRmlsZU9wcyBmcm9tIFwiLi9tb2R1bGVzL0ZpbGVPcHMuanNcIjtcclxuaW1wb3J0IEF1dGhlbnRpY2F0ZSBmcm9tIFwiLi9tb2R1bGVzL0F1dGhlbnRpY2F0ZS5qc1wiO1xyXG5pbXBvcnQgSG9zdFZpZXcgZnJvbSBcIi4vSG9zdFZpZXcuanNcIjtcclxuaW1wb3J0IEhvc3RDb250cm9sbGVyIGZyb20gXCIuL0hvc3RDb250cm9sbGVyXCI7XHJcblxyXG5pbXBvcnQgXCIuL21vZHVsZXMvR2FtZUJvYXJkLmpzXCI7XHJcbmltcG9ydCBcIi4vbW9kdWxlcy9NdWx0aXBsZUNob2ljZVBhbmUuanNcIjtcclxuaW1wb3J0IFwiLi9tb2R1bGVzL0NoZWNrQm94LmpzXCI7XHJcbmltcG9ydCBcIi4vbW9kdWxlcy9QbGF5ZXJDb250YWluZXIuanNcIjtcclxuaW1wb3J0IFwiLi9tb2R1bGVzL1BsYXllclBhbmVsLmpzXCI7XHJcblxyXG5sZXQgZmlsZU9wcyA9IG5ldyBGaWxlT3BzKCk7XHJcbmxldCBtb2RlbCA9IG51bGw7XHJcbmxldCBxdWVzdGlvblBhbmUgPSBudWxsO1xyXG5sZXQgZWRpdG9yUGFuZSA9IG51bGw7XHJcblxyXG53aW5kb3cub25sb2FkID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgbGV0IHN0YXJ0ID0gbmV3IERhdGUoKTtcclxuXHJcbiAgICB3aW5kb3cuaG9zdFZpZXcgPSBuZXcgSG9zdFZpZXcoKTtcclxuXHJcbiAgICAvLyBuZXcgTWVudSgpLmluaXQoXCIjbWVudVwiKTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IG5ldyBBdXRoZW50aWNhdGUoKS5sb2FkQ2xpZW50KCk7XHJcbiAgICAgICAgYXdhaXQgZmlsZU9wcy5sb2FkQ2xpZW50KCk7XHJcbiAgICAgICAgYXdhaXQgc2VuZFRva2VuVG9TZXJ2ZXIoKTtcclxuICAgICAgICBsZXQgd3MgPSBhd2FpdCBjb25uZWN0V2Vic29ja2V0KCk7XHJcbiAgICAgICAgbmV3IEhvc3RDb250cm9sbGVyKHdzLCB3aW5kb3cuaG9zdFZpZXcpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgZW5kID0gbmV3IERhdGUoKTtcclxuICAgIGxldCB0aW1lID0gZW5kIC0gc3RhcnQ7XHJcbiAgICBjb25zb2xlLmxvZyhcIkxvYWQgVGltZSBcIiArIHRpbWUgKyBcIiBtc1wiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2VuZFRva2VuVG9TZXJ2ZXIoKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KT0+IHtcclxuICAgICAgICBsZXQgdG9rZW4gPSBnYXBpLmF1dGgyLmdldEF1dGhJbnN0YW5jZSgpLmN1cnJlbnRVc2VyLmdldCgpLmdldEF1dGhSZXNwb25zZSgpLmlkX3Rva2VuO1xyXG4gICAgICAgIHZhciB4aHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cclxuICAgICAgICB4aHR0cC5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgbGV0IHJlc3BvbnNlID0gSlNPTi5wYXJzZSh4aHR0cC5yZXNwb25zZVRleHQpO1xyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UucmVzdWx0ID09PSBcInN1Y2Nlc3NcIikgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICBlbHNlIHJlamVjdChuZXcgRXJyb3IoXCJ0b2tlbiByZWplY3RlZFwiKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHhodHRwLm9wZW4oXCJQT1NUXCIsIFwiY29ubmVjdC1ob3N0XCIpO1xyXG4gICAgICAgIHhodHRwLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LXR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xyXG4gICAgICAgIHhodHRwLnNlbmQoSlNPTi5zdHJpbmdpZnkoe3Rva2VuOiB0b2tlbn0pKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb25uZWN0V2Vic29ja2V0KCl7XHJcbiAgICBsZXQgdXJsID0gd2luZG93Lm9yaWdpbjtcclxuICAgIGlmICh1cmwuc3RhcnRzV2l0aChcImh0dHA6XCIpKXtcclxuICAgICAgICB1cmwgPSBcIndzXCIgKyB1cmwuc3Vic3RyKDQpICsgXCIvZ2FtZS1zZXJ2aWNlLndzXCI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHVybCA9IFwid3NzXCIgKyB1cmwuc3Vic3RyKDUpICsgXCIvZ2FtZS1zZXJ2aWNlLndzXCI7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpPT57XHJcbiAgICAgICAgbGV0IHNvY2tldCA9IG5ldyBXZWJTb2NrZXQodXJsKTtcclxuICAgICAgICBzb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoZXZlbnQpID0+IHJlamVjdChldmVudCkpO1xyXG4gICAgICAgIHNvY2tldC5hZGRFdmVudExpc3RlbmVyKCdvcGVuJywgKGV2ZW50KSA9PiByZXNvbHZlKHNvY2tldCkpO1xyXG4gICAgfSk7XHJcbn0iLCIvLyBzZWUgaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vZHJpdmUvYXBpL3YzL3F1aWNrc3RhcnQvanM/aGw9ZW5cclxuXHJcbmNsYXNzIEF1dGhlbnRpY2F0ZSB7XHJcbiAgICBjb25zdHJ1Y3Rvcigpe1xyXG4gICAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgcmVxdWlyZShcIi4vZ29vZ2xlRmllbGRzLmpzXCIpKTtcclxuICAgIH1cclxuXHJcbiAgICBsb2FkQ2xpZW50KCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGdhcGkubG9hZCgnY2xpZW50OmF1dGgyJywgKCkgPT4gdGhpcy5fX2luaXRDbGllbnQocmVzb2x2ZSwgcmVqZWN0KSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgX19pbml0Q2xpZW50KHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIGdhcGkuY2xpZW50LmluaXQoe1xyXG4gICAgICAgICAgICBhcGlLZXk6IHRoaXMuZGV2ZWxvcGVyS2V5LFxyXG4gICAgICAgICAgICBjbGllbnRJZDogdGhpcy5jbGllbnRJZCxcclxuICAgICAgICAgICAgZGlzY292ZXJ5RG9jczogdGhpcy5kaXNjb3ZlcnlEb2NzLFxyXG4gICAgICAgICAgICBzY29wZTogdGhpcy5zY29wZVxyXG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJFUlJPUiBJTklUXCIpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICAgICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaXNBdXRob3JpemVkKCl7XHJcbiAgICAgICAgdmFyIHVzZXIgPSBnYXBpLmF1dGgyLmdldEF1dGhJbnN0YW5jZSgpLmN1cnJlbnRVc2VyLmdldCgpO1xyXG4gICAgICAgIHJldHVybiB1c2VyLmhhc0dyYW50ZWRTY29wZXModGhpcy5zY29wZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2lnbkluKCl7XHJcbiAgICAgICAgZ2FwaS5hdXRoMi5nZXRBdXRoSW5zdGFuY2UoKS5zaWduSW4oKTtcclxuICAgIH1cclxuXHJcbiAgICBzaWduT3V0KCl7XHJcbiAgICAgICAgZ2FwaS5hdXRoMi5nZXRBdXRoSW5zdGFuY2UoKS5zaWduT3V0KCk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEF1dGhlbnRpY2F0ZTsiLCJjb25zdCBOaWRnZXRFbGVtZW50ID0gcmVxdWlyZShcIkBUaGFlcmlvdXMvbmlkZ2V0XCIpLk5pZGdldEVsZW1lbnQ7XHJcblxyXG5jbGFzcyBWYWx1ZVVwYWRhdGUgZXh0ZW5kcyAgQ3VzdG9tRXZlbnR7XHJcbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSkge1xyXG4gICAgICAgIHN1cGVyKCd2YWx1ZS11cGRhdGUnLFxyXG4gICAgICAgICAgICB7ZGV0YWlsIDoge3ZhbHVlIDogdmFsdWV9fVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIENoZWNrQm94IGV4dGVuZHMgTmlkZ2V0RWxlbWVudCB7XHJcbiAgICBhc3luYyBjb25uZWN0ZWRDYWxsYmFjaygpe1xyXG4gICAgICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XHJcbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCk9PntcclxuICAgICAgICAgICAgdGhpcy50b2dnbGUoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB0b2dnbGUoKXtcclxuICAgICAgICBpZiAodGhpcy5jaGVja2VkID09PSAndHJ1ZScpIHRoaXMuY2hlY2tlZCA9ICdmYWxzZSc7XHJcbiAgICAgICAgZWxzZSB0aGlzLmNoZWNrZWQgPSAndHJ1ZSdcclxuICAgIH1cclxuXHJcbiAgICBnZXQgY2hlY2tlZCgpe1xyXG4gICAgICAgIGlmICghdGhpcy5oYXNBdHRyaWJ1dGUoQ2hlY2tCb3guQ0hFQ0tFRF9BVFRSSUJVVEUpKXtcclxuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoQ2hlY2tCb3guQ0hFQ0tFRF9BVFRSSUJVVEUsICdmYWxzZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoQ2hlY2tCb3guQ0hFQ0tFRF9BVFRSSUJVVEUpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCBjaGVja2VkKHZhbHVlKXtcclxuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShDaGVja0JveC5DSEVDS0VEX0FUVFJJQlVURSwgdmFsdWUpO1xyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgVmFsdWVVcGFkYXRlKHZhbHVlKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbkNoZWNrQm94LkNIRUNLRURfQVRUUklCVVRFID0gXCJjaGVja2VkXCI7XHJcbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ2NoZWNrLWJveCcsIENoZWNrQm94KTtcclxubW9kdWxlLmV4cG9ydHMgPSBDaGVja0JveDsiLCJcInVzZSBzdHJpY3RcIjtcclxuLy8gc2VlIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL2RyaXZlL2FwaS92My9xdWlja3N0YXJ0L2pzP2hsPWVuXHJcblxyXG5jbGFzcyBGaWxlT3BzIHtcclxuXHJcbiAgICBhc3luYyBsb2FkKCl7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkQ2xpZW50KCk7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkRHJpdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBsb2FkQ2xpZW50KCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGdhcGkubG9hZCgnY2xpZW50JywgKCkgPT4gcmVzb2x2ZSgpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBsb2FkRHJpdmUoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgZ2FwaS5jbGllbnQubG9hZCgnZHJpdmUnLCAndjMnLCByZXNvbHZlKCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGNyZWF0ZShmaWxlbmFtZSA9IFwiR2FtZSBOYW1lLmpzb25cIil7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpPT4ge1xyXG4gICAgICAgICAgICBnYXBpLmNsaWVudC5kcml2ZS5maWxlcy5jcmVhdGUoe1xyXG4gICAgICAgICAgICAgICAgbmFtZSA6IGZpbGVuYW1lLFxyXG4gICAgICAgICAgICAgICAgcGFyZW50czogWydhcHBEYXRhRm9sZGVyJ10sXHJcbiAgICAgICAgICAgICAgICBmaWVsZHM6IFwiaWRcIlxyXG4gICAgICAgICAgICB9KS50aGVuKHJlcz0+e1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXMucmVzdWx0LmlkKTtcclxuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBkZWxldGUoZmlsZUlkKXtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCk9PiB7XHJcbiAgICAgICAgICAgIGdhcGkuY2xpZW50LmRyaXZlLmZpbGVzLmRlbGV0ZSh7XHJcbiAgICAgICAgICAgICAgICBmaWxlSWQgOiBmaWxlSWRcclxuICAgICAgICAgICAgfSkudGhlbihyZXM9PntcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzLnJlc3VsdCk7XHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgbGlzdCgpe1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KT0+IHtcclxuICAgICAgICAgICAgZ2FwaS5jbGllbnQuZHJpdmUuZmlsZXMubGlzdCh7XHJcbiAgICAgICAgICAgICAgICAvLyBxOiBgbmFtZSBjb250YWlucyAnLmpzb24nYCxcclxuICAgICAgICAgICAgICAgIHNwYWNlczogJ2FwcERhdGFGb2xkZXInLFxyXG4gICAgICAgICAgICAgICAgZmllbGRzOiAnZmlsZXMvbmFtZSxmaWxlcy9pZCxmaWxlcy9tb2RpZmllZFRpbWUnXHJcbiAgICAgICAgICAgIH0pLnRoZW4ocmVzPT57XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlcy5yZXN1bHQuZmlsZXMpO1xyXG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGdldChmaWxlSWQpe1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KT0+IHtcclxuICAgICAgICAgICAgZ2FwaS5jbGllbnQuZHJpdmUuZmlsZXMuZ2V0KHtcclxuICAgICAgICAgICAgICAgIGZpbGVJZDogZmlsZUlkLFxyXG4gICAgICAgICAgICAgICAgYWx0OiAnbWVkaWEnXHJcbiAgICAgICAgICAgIH0pLnRoZW4ocmVzPT57XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlcyk7XHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBzZXRCb2R5KGZpbGVJZCwgYm9keSl7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpPT4ge1xyXG4gICAgICAgICAgICBnYXBpLmNsaWVudC5yZXF1ZXN0KHtcclxuICAgICAgICAgICAgICAgIHBhdGggOiBcInVwbG9hZC9kcml2ZS92My9maWxlcy9cIiArIGZpbGVJZCxcclxuICAgICAgICAgICAgICAgIG1ldGhvZCA6IFwiUEFUQ0hcIixcclxuICAgICAgICAgICAgICAgIHBhcmFtcyA6IHtcclxuICAgICAgICAgICAgICAgICAgICB1cGxvYWRUeXBlIDogXCJtZWRpYVwiXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgaGVhZGVycyA6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBib2R5IDogYm9keVxyXG4gICAgICAgICAgICB9KS50aGVuKHJlcz0+e1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShKU09OLnBhcnNlKHJlcy5ib2R5KSk7XHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZW5hbWUoZmlsZUlkLCBmaWxlbmFtZSl7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpPT4ge1xyXG4gICAgICAgICAgICBnYXBpLmNsaWVudC5kcml2ZS5maWxlcy51cGRhdGUoe1xyXG4gICAgICAgICAgICAgICAgZmlsZUlkOiBmaWxlSWQsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBmaWxlbmFtZVxyXG4gICAgICAgICAgICB9KS50aGVuKHJlcz0+e1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShKU09OLnBhcnNlKHJlcy5ib2R5KSk7XHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgRmlsZU9wczsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbi8qKiBWaWV3LUNvbnRyb2xsZXIgZm9yIHRoZSBIVE1MIGdhbWUgYm9hcmQgZWxlbWVudFxyXG4gICAgVGhpcyBpcyB0aGUgY2xhc3NpY2FsIFwiSmVvcGFyZHlcIiB0eXBlIGJvYXJkXHJcbiAgICBUaGlzIGlzIG1vZGVsIGFnbm9zdGljLCBzZWUgRWRpdG9yUGFuZS5qcyBmb3IgbW9kZWwgbWV0aG9kc1xyXG4gICAgZ2VuZXJhdGVzIHRoZSBmb2xsb3dpbmcgZXZlbnRzOlxyXG4gICAgICAgIGNlbGwtc2VsZWN0IChyb3csIGNvbCk6IHdoZW4gYSB1c2VyIGNsaWNrcyBhIGNlbGxcclxuICAgICAgICBoZWFkZXItdXBkYXRlICh2YWx1ZSwgY29sLCBmb250c2l6ZSkgOiB3aGVuIHRoZSBoZWFkZXIgdGV4dCBjaGFuZ2VzIChhbmQgYmx1cnMpXHJcbiAqKi9cclxuXHJcbmNvbnN0IE5pZGdldEVsZW1lbnQgPSByZXF1aXJlKFwiQFRoYWVyaW91cy9uaWRnZXRcIikuTmlkZ2V0RWxlbWVudDtcclxuXHJcbmNsYXNzIENlbGxTZWxlY3RFdmVudCBleHRlbmRzIEN1c3RvbUV2ZW50e1xyXG4gICAgY29uc3RydWN0b3Iocm93LCBjb2wpIHtcclxuICAgICAgICBzdXBlcignY2VsbC1zZWxlY3QnLFxyXG4gICAgICAgICAgICAgIHtkZXRhaWwgOiB7cm93IDogcm93LCBjb2wgOiBjb2wgfX1cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBIZWFkZXJVcGRhdGVFdmVudCBleHRlbmRzICBDdXN0b21FdmVudHtcclxuICAgIGNvbnN0cnVjdG9yKGNvbCwgdmFsdWUsIGZvbnRTaXplKSB7XHJcbiAgICAgICAgc3VwZXIoJ2hlYWRlci11cGRhdGUnLFxyXG4gICAgICAgICAgICB7ZGV0YWlsIDoge3ZhbHVlIDogdmFsdWUsIGNvbCA6IGNvbCwgZm9udFNpemUgOiBmb250U2l6ZX19XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgR2FtZUJvYXJkIGV4dGVuZHMgTmlkZ2V0RWxlbWVudCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJlYWR5KCl7XHJcbiAgICAgICAgYXdhaXQgc3VwZXIucmVhZHkoKTtcclxuICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCA2OyBjb2wrKykge1xyXG4gICAgICAgICAgICB0aGlzLmdldEhlYWRlcihjb2wpLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoZXZlbnQpPT5ldmVudC50YXJnZXQuZml0VGV4dC5ub3RpZnkoMSwgMSkpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5nZXRIZWFkZXIoY29sKS5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoZXZlbnQpPT57XHJcbiAgICAgICAgICAgICAgICBsZXQgZm9udFNpemUgPSBldmVudC50YXJnZXQuc3R5bGVbXCJmb250LXNpemVcIl07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEhlYWRlclVwZGF0ZUV2ZW50KGNvbCwgZXZlbnQudGFyZ2V0LnRleHQsIGZvbnRTaXplKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgNTsgcm93KyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q2VsbChyb3csIGNvbCkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IENlbGxTZWxlY3RFdmVudChyb3csIGNvbCkpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgdGhlIHZhbHVlIG9mIGEgY2F0ZWdvcnlcclxuICAgICAqIEBwYXJhbSBpbmRleFxyXG4gICAgICogQHBhcmFtIHZhbHVlXHJcbiAgICAgKiBAcGFyYW0gdmFsdWVcclxuICAgICAqL1xyXG4gICAgc2V0SGVhZGVyKGluZGV4LCB2YWx1ZSwgZm9udFNpemUsIGxvY2sgPSBmYWxzZSl7XHJcbiAgICAgICAgbGV0IGVsZW1lbnQgPSB0aGlzLmdldEhlYWRlcihpbmRleCk7XHJcbiAgICAgICAgZWxlbWVudC50ZXh0ID0gdmFsdWU7XHJcbiAgICAgICAgY29uc29sZS5sb2coZm9udFNpemUpO1xyXG4gICAgICAgIGlmIChmb250U2l6ZSkgZWxlbWVudC5zdHlsZVtcImZvbnQtc2l6ZVwiXSA9IGZvbnRTaXplO1xyXG4gICAgICAgIGlmIChsb2NrKXtcclxuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJjb250ZW50RWRpdGFibGVcIiwgXCJmYWxzZVwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXRyaWV2ZSB0aGUgaGVhZGVyIGh0bWwgZWxlbWVudFxyXG4gICAgICogQHBhcmFtIGluZGV4XHJcbiAgICAgKiBAcGFyYW0gdmFsdWVcclxuICAgICAqL1xyXG4gICAgZ2V0SGVhZGVyKGluZGV4KXtcclxuICAgICAgICBpZiAodHlwZW9mIGluZGV4ICE9PSBcIm51bWJlclwiIHx8IGluZGV4IDwgMCB8fCBpbmRleCA+IDYpIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgaW5kZXg6IFwiICsgaW5kZXgpO1xyXG4gICAgICAgIGxldCBzZWxlY3RvciA9IGBbZGF0YS1yb3c9J2gnXVtkYXRhLWNvbD0nJHtpbmRleH0nXSA+IC52YWx1ZWA7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgdGhlIHZhbHVlIG9mIGEgbm9uLWNhdGVnb3J5IGNlbGwuXHJcbiAgICAgKiBAcGFyYW0gcm93XHJcbiAgICAgKiBAcGFyYW0gY29sXHJcbiAgICAgKiBAcGFyYW0gdmFsdWVcclxuICAgICAqL1xyXG4gICAgc2V0Q2VsbChyb3csIGNvbCwgdmFsdWUgPSBcIlwiKXtcclxuICAgICAgICB0aGlzLmdldENlbGwocm93LCBjb2wpLnRleHRDb250ZW50ID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q2VsbChyb3csIGNvbCl7XHJcbiAgICAgICAgbGV0IHNlbGVjdG9yID0gYFtkYXRhLXJvdz1cIiR7cm93fVwiXVtkYXRhLWNvbD1cIiR7Y29sfVwiXSA+IC52YWx1ZWA7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q29tcGxldGUocm93LCBjb2wsIHZhbHVlKXtcclxuICAgICAgICBpZiAodHlwZW9mIHJvdyAhPT0gXCJudW1iZXJcIiB8fCByb3cgPCAwIHx8IHJvdyA+IDYpIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgcm93OiBcIiArIHJvdyk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjb2wgIT09IFwibnVtYmVyXCIgfHwgY29sIDwgMCB8fCBjb2wgPiA1KSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGNvbDogXCIgKyBjb2wpO1xyXG4gICAgICAgIHRoaXMuZ2V0Q2VsbChyb3csIGNvbCkuc2V0QXR0cmlidXRlKFwiZGF0YS1jb21wbGV0ZVwiLCB2YWx1ZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ2dhbWUtYm9hcmQnLCBHYW1lQm9hcmQpO1xyXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWVCb2FyZDsiLCJjb25zdCBOaWRnZXRFbGVtZW50ID0gcmVxdWlyZShcIkBUaGFlcmlvdXMvbmlkZ2V0XCIpLk5pZGdldEVsZW1lbnQ7XHJcbnJlcXVpcmUoXCIuL0NoZWNrQm94LmpzXCIpO1xyXG5cclxuY2xhc3MgVGV4dFVwZGF0ZSBleHRlbmRzICBDdXN0b21FdmVudHtcclxuICAgIGNvbnN0cnVjdG9yKGluZGV4LCB0ZXh0KSB7XHJcbiAgICAgICAgc3VwZXIoJ3RleHQtdXBkYXRlJyxcclxuICAgICAgICAgICAge2RldGFpbCA6IHtpbmRleCA6IGluZGV4LCB0ZXh0IDogdGV4dH19XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgVmFsdWVVcGRhdGUgZXh0ZW5kcyAgQ3VzdG9tRXZlbnR7XHJcbiAgICBjb25zdHJ1Y3RvcihpbmRleCwgdmFsdWUpIHtcclxuICAgICAgICBzdXBlcigndmFsdWUtdXBkYXRlJyxcclxuICAgICAgICAgICAge2RldGFpbCA6IHtpbmRleCA6IGluZGV4LCB2YWx1ZSA6IHZhbHVlfX1cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBRdWVzdGlvbkNsaWNrIGV4dGVuZHMgIEN1c3RvbUV2ZW50e1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoJ2J1dHRvbi1xdWVzdGlvbicpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBNdWx0aXBsZUNob2ljZVBhbmUgZXh0ZW5kcyBOaWRnZXRFbGVtZW50IHtcclxuXHJcbiAgICBzZXRNb2RlbChtb2RlbCl7XHJcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJlYWR5KCl7XHJcbiAgICAgICAgYXdhaXQgc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2soKTtcclxuICAgICAgICBmb3IgKGxldCBlbGVtZW50IG9mIHRoaXMucXVlcnlTZWxlY3RvckFsbChcIi5hbnN3ZXIgPiBuaWRnZXQtdGV4dFwiKSl7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuZml0VGV4dC5sb2NrID0gXCJ2aFwiO1xyXG4gICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCAoZXZlbnQpPT50aGlzLnR4dExpc3RlbmVyKGV2ZW50KSk7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKGV2ZW50KT0+e1xyXG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gZXZlbnQudGFyZ2V0LmdldEF0dHJpYnV0ZShcImRhdGEtaW5kZXhcIik7XHJcbiAgICAgICAgICAgICAgICBsZXQgdGV4dCA9IHRoaXMucXVlcnlTZWxlY3RvcihgbmlkZ2V0LXRleHRbZGF0YS1pbmRleD1cIiR7aW5kZXh9XCJdYCkudGV4dDtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgVGV4dFVwZGF0ZShpbmRleCwgdGV4dCkpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgZWxlbWVudCBvZiB0aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoXCJjaGVjay1ib3hcIikpe1xyXG4gICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ2YWx1ZS11cGRhdGVcIiwgKGV2ZW50KT0+e1xyXG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZXZlbnQudGFyZ2V0KS5nZXRQcm9wZXJ0eVZhbHVlKFwiLS1pbmRleFwiKTtcclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IGV2ZW50LmRldGFpbC52YWx1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgVmFsdWVVcGRhdGUoaW5kZXgsIHZhbHVlKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5xdWVyeVNlbGVjdG9yKFwiI3Nob3ctcXVlc3Rpb25cIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpPT57XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgUXVlc3Rpb25DbGljaygpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB0eHRMaXN0ZW5lcihldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC53aGljaCA9PT0gMTMpe1xyXG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBpbmRleCA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGV2ZW50LnRhcmdldCkuZ2V0UHJvcGVydHlWYWx1ZShcIi0taW5kZXhcIik7XHJcbiAgICAgICAgICAgIGluZGV4ID0gcGFyc2VJbnQoaW5kZXgpO1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggPj0gNSl7XHJcbiAgICAgICAgICAgICAgICBldmVudC50YXJnZXQuYmx1cigpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGV0IHNlbGVjdG9yID0gYG5pZGdldC10ZXh0W2RhdGEtaW5kZXg9XCIke2luZGV4ICsgMX1cIl1gO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKS5mb2N1cygpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGV2ZW50LnRhcmdldC5maXRUZXh0Lm5vdGlmeSgxLCAxKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSBidXR0b24geydxdWVzdGlvbicsICdhbnN3ZXInfVxyXG4gICAgICovXHJcbiAgICBoaWdobGlnaHQoYnV0dG9uKXtcclxuICAgICAgICBmb3IgKGxldCBlbGUgb2YgdGhpcy5xdWVyeVNlbGVjdG9yQWxsKGAuc2VsZWN0ZWRgKSkgZWxlLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3RlZFwiKTtcclxuICAgICAgICB0aGlzLnF1ZXJ5U2VsZWN0b3IoYCNzaG93LSR7YnV0dG9ufWApLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RlZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRUZXh0KGluZGV4LCB0ZXh0KXtcclxuICAgICAgICB0aGlzLnF1ZXJ5U2VsZWN0b3IoYG5pZGdldC10ZXh0W2RhdGEtaW5kZXg9XCIke2luZGV4fVwiXWApLnRleHQgPSB0ZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIHNldENoZWNrZWQoaW5kZXgsIHZhbHVlKXtcclxuICAgICAgICB0aGlzLnF1ZXJ5U2VsZWN0b3IoYGNoZWNrLWJveFtkYXRhLWluZGV4PVwiJHtpbmRleH1cIl1gKS5jaGVja2VkID0gdmFsdWU7XHJcbiAgICB9XHJcbn1cclxuXHJcbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ211bHRpcGxlLWNob2ljZS1wYW5lJywgTXVsdGlwbGVDaG9pY2VQYW5lKTtcclxubW9kdWxlLmV4cG9ydHMgPSBNdWx0aXBsZUNob2ljZVBhbmU7IiwiXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5jb25zdCBOaWRnZXRFbGVtZW50ID0gcmVxdWlyZShcIkBUaGFlcmlvdXMvbmlkZ2V0XCIpLk5pZGdldEVsZW1lbnQ7XHJcbmltcG9ydCBQbGF5ZXJQYW5lbCBmcm9tIFwiLi9QbGF5ZXJQYW5lbC5qc1wiO1xyXG5cclxuY2xhc3MgUGxheWVyQ29udGFpbmVyIGV4dGVuZHMgTmlkZ2V0RWxlbWVudCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJlYWR5KCl7XHJcbiAgICAgICAgYXdhaXQgc3VwZXIucmVhZHkoKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRQbGF5ZXIobmFtZSwgc2NvcmUgPSAwKXtcclxuICAgICAgICBsZXQgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwbGF5ZXItcGFuZWxcIik7XHJcbiAgICAgICAgZWxlbWVudC5uYW1lID0gbmFtZTtcclxuICAgICAgICBlbGVtZW50LnNjb3JlID0gc2NvcmU7XHJcbiAgICAgICAgdGhpcy5hcHBlbmQoZWxlbWVudCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ3BsYXllci1jb250YWluZXInLCBQbGF5ZXJDb250YWluZXIpO1xyXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXllckNvbnRhaW5lcjsiLCJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmNvbnN0IE5pZGdldEVsZW1lbnQgPSByZXF1aXJlKFwiQFRoYWVyaW91cy9uaWRnZXRcIikuTmlkZ2V0RWxlbWVudDtcclxuaW1wb3J0IFwiLi9QbGF5ZXJQYW5lbC5qc1wiO1xyXG5cclxuY2xhc3MgUGxheWVyUGFuZWwgZXh0ZW5kcyBOaWRnZXRFbGVtZW50IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcmVhZHkoKXtcclxuICAgICAgICBhd2FpdCBzdXBlci5yZWFkeSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldCBuYW1lKHZhbHVlKXtcclxuICAgICAgICB0aGlzLnF1ZXJ5U2VsZWN0b3IoXCIjbmFtZVwiKS50ZXh0ID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IHNjb3JlKHZhbHVlKXtcclxuICAgICAgICB0aGlzLnF1ZXJ5U2VsZWN0b3IoXCIjc2NvcmVcIikudGV4dCA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBuYW1lKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlTZWxlY3RvcihcIiNuYW1lXCIpLnRleHQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHNjb3JlKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlTZWxlY3RvcihcIiNzY29yZVwiKS50ZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIGJ1enooKXtcclxuICAgICAgICB0aGlzLnF1ZXJ5U2VsZWN0b3IoXCIjYnV6ei1saWdodFwiKS5jbGFzc0xpc3QuYWRkKFwic3dlZXAtcmlnaHRcIik7XHJcbiAgICAgICAgdGhpcy5xdWVyeVNlbGVjdG9yKFwiI25hbWVcIikuY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKTtcclxuICAgICAgICB0aGlzLnF1ZXJ5U2VsZWN0b3IoXCIjc2NvcmVcIikuY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKTtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhcigpe1xyXG4gICAgICAgIHRoaXMucXVlcnlTZWxlY3RvcihcIiNidXp6LWxpZ2h0XCIpLmNsYXNzTGlzdC5yZW1vdmUoXCJzd2VlcC1yaWdodFwiKTtcclxuICAgICAgICB0aGlzLnF1ZXJ5U2VsZWN0b3IoXCIjbmFtZVwiKS5jbGFzc0xpc3QucmVtb3ZlKFwiYWN0aXZlXCIpO1xyXG4gICAgICAgIHRoaXMucXVlcnlTZWxlY3RvcihcIiNzY29yZVwiKS5jbGFzc0xpc3QucmVtb3ZlKFwiYWN0aXZlXCIpO1xyXG4gICAgICAgIHRoaXMucXVlcnlTZWxlY3RvckFsbChcIi5jbG9jay10aWNrXCIpLmZvckVhY2goZSA9PiBlLmNsYXNzTGlzdC5yZW1vdmUoXCJzcGVudFwiKSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VGltZXIocGVyY2VudCl7XHJcbiAgICAgICAgaWYgKHBlcmNlbnQgPD0gODApIHRoaXMucXVlcnlTZWxlY3RvcihcIi5jbG9jay10aWNrW2RhdGEtaW5kZXg9JzQnXVwiKS5jbGFzc0xpc3QuYWRkKFwic3BlbnRcIik7XHJcbiAgICAgICAgaWYgKHBlcmNlbnQgPD0gNjApIHRoaXMucXVlcnlTZWxlY3RvcihcIi5jbG9jay10aWNrW2RhdGEtaW5kZXg9JzMnXVwiKS5jbGFzc0xpc3QuYWRkKFwic3BlbnRcIik7XHJcbiAgICAgICAgaWYgKHBlcmNlbnQgPD0gNDApIHRoaXMucXVlcnlTZWxlY3RvcihcIi5jbG9jay10aWNrW2RhdGEtaW5kZXg9JzInXVwiKS5jbGFzc0xpc3QuYWRkKFwic3BlbnRcIik7XHJcbiAgICAgICAgaWYgKHBlcmNlbnQgPD0gMjApIHRoaXMucXVlcnlTZWxlY3RvcihcIi5jbG9jay10aWNrW2RhdGEtaW5kZXg9JzEnXVwiKS5jbGFzc0xpc3QuYWRkKFwic3BlbnRcIik7XHJcbiAgICAgICAgaWYgKHBlcmNlbnQgPD0gMCkgIHRoaXMucXVlcnlTZWxlY3RvcihcIi5jbG9jay10aWNrW2RhdGEtaW5kZXg9JzAnXVwiKS5jbGFzc0xpc3QuYWRkKFwic3BlbnRcIik7XHJcbiAgICB9XHJcbn1cclxuXHJcbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ3BsYXllci1wYW5lbCcsIFBsYXllclBhbmVsKTtcclxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXJQYW5lbDsiLCJcclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvLyBUaGUgQnJvd3NlciBBUEkga2V5IG9idGFpbmVkIGZyb20gdGhlIEdvb2dsZSBBUEkgQ29uc29sZS5cclxuICAgIGRldmVsb3BlcktleSA6ICdBSXphU3lBQmNkTG1UNkhIXzdHbzgycV9JQkdJM2ptNlVMNHc0UTAnLFxyXG5cclxuICAgIC8vIFRoZSBDbGllbnQgSUQgb2J0YWluZWQgZnJvbSB0aGUgR29vZ2xlIEFQSSBDb25zb2xlLiBSZXBsYWNlIHdpdGggeW91ciBvd24gQ2xpZW50IElELlxyXG4gICAgY2xpZW50SWQgOiBcIjE1ODgyMzEzNDY4MS05OGJna2FuZ29sdGs2MzZ1a2Y4cG9mZWlzN3BhN2piay5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbVwiLFxyXG5cclxuICAgIC8vIFJlcGxhY2Ugd2l0aCB5b3VyIG93biBwcm9qZWN0IG51bWJlciBmcm9tIGNvbnNvbGUuZGV2ZWxvcGVycy5nb29nbGUuY29tLlxyXG4gICAgYXBwSWQgOiBcIjE1ODgyMzEzNDY4MVwiLFxyXG5cclxuICAgIC8vIEFycmF5IG9mIEFQSSBkaXNjb3ZlcnkgZG9jIFVSTHMgZm9yIEFQSXMgdXNlZCBieSB0aGUgcXVpY2tzdGFydFxyXG4gICAgZGlzY292ZXJ5RG9jcyA6IFtcImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2Rpc2NvdmVyeS92MS9hcGlzL2RyaXZlL3YzL3Jlc3RcIl0sXHJcblxyXG4gICAgLy8gU2NvcGUgdG8gdXNlIHRvIGFjY2VzcyB1c2VyJ3MgRHJpdmUgaXRlbXMuXHJcbiAgICBzY29wZTogXCJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9hdXRoL2RyaXZlLmZpbGVcIlxyXG59Il19
