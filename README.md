# Steps

## Installation
`git clone https://github.com/varadero/steps.git`

`cd steps`

`npm install`

## Build
The source code is written in TypeScript and must be build before use:

`npm run build`

Instead of `npm run build` you can watch for changes while developing so you don't need to `npm run build` every time a change is made:

`npm run build -- --watch`

Build will produce the file `steps.js`. Include it as last element of the `body` in your HTML:
```html
...
    <script src="steps.js"></script>
</body>
```

## Description
Manages multiple HTML templates by showing and hiding them simulating wizard-like steps.

## How it works
A combination of HTML (template) and JavaScript class (controller) form a single step. HTML have specific characteristics (special element attributes) which are understandable for the controller so it can attach to HTML element events and change their behavior if needed. When the main library code runs, it will inspect the entire document to find these specific HTML elements and will create instances of controllers that will manage them.

A breadcrumb-like navigation can be added which shows the performed steps.

## HTML Templates
All the step templates must be wrapped in an element with attribute `steps-container` with value set to the name of the steps group (multiple step wrappers/groups can exist in the document but only one will be defined for most of the scenarios). A sample steps wrapper element:
```html
<div steps-container="mySteps">
    ... Step templates ...
</div>
```
Each step has a template. Its elements are marked with specific HTML attributes so the code can recognize the role of the elements and what should happen when the user interacts with them. Step template wrapper element that contains all other template elements has `step-name` attribute with unique value and `step-controller` specifying the name of the class (or constructor function) which is instantiated in order to manage the template.

There are two types of built in HTML templates:
- Clickable items - can contain multiple items clicking on which will move to the next step. The name of the controller is `StepsClickableItemsController`
- Search - requests the server to get search results and shows them (showing results is still not imlemented). The name of the controller is `StepsSearchBrandController`

### Clickable items HTML template sample
A sample containing the step template with 2 clickable items:
```html
<div step-name="genderStep" step-text="Gender" step-controller="StepsClickableItemsController"
    class="step gender-step clickable-items-step">
    <div step-clickable-item step-clickable-item-data='{"selected": "female"}'
        step-clickable-item-goes-to-step="femaleStep" class="clickable-item">
        <img step-clickable-item-image src="assets/images/female.svg" class="clickable-item-image" />
        <span step-clickable-item-text>Female</span>
    </div>
    <div step-clickable-item step-clickable-item-data='{"selected": "male"}'
        step-clickable-item-goes-to-step="maleStep" class="clickable-item">
        <img step-clickable-item-image src="assets/images/male.svg" class="clickable-item-image" />
        <span step-clickable-item-text>Male</span>
    </div>
</div>
```
Specific elements and attributes in clickable items template:
- Step wrapper element (`<div step-name="genderStep" ...`)
  - `step-name` - must contain unique step name
  - `step-text` - this text will appear in the breadcrumb when the user is at that step
  - `step-controller`  the name of the controller that will manage this template
    - Clickable item inside the template - multiple such elements can   exist inside this type of template (`<div step-clickable-item ...  `)
    - `step-clickable-item` - specifies the element as clickable   item. The controller will attach to click event of this element   and will perform the logic (storing the data of the element and   moving to the next step) if the user clicks on it
    - `step-clickable-item-data` - the data associated with this   item. It will be remembered as selection for this step if the   item is clicked by the user. Can contain JSON   (`step-clickable-item-data='{"selected":"female"}'`), string   (`step-clickable-item-data="female"`) or number   (`step-clickable-item-data="1"`). The content of this attribute   will become part of the data that is sent to the server when   search is performed
    - `step-clickable-item-goes-to-step` - which step must be shown   after this item is clicked. Must contain value specified in the   `step-name` attribute of the target step wrapper element
    - The sample template contains two more elements as children of `<div step-clickable-item ...` - `<img step-clickable-item-image ...` and `<span step-clickable-item-text ...` - they are added for completing the template (with image and text) but are not required and can be replaced with any other HTML elements.

### Search step HTML template sample
```html
<div step-name="searchStep" step-text="Search brand" step-controller="StepsSearchBrandController"
    step-search-brand-search-path="search-brand.php" class="step search-brand-step clickable-items-step">
    <div>
        <div>
            <div>
                <label for="brandSearchInput">Brand</label>
            </div>
            <div>
                <input step-search-brand-input name="brandSearchInput" placeholder="Brand name" />
            </div>
        </div>
        <div step-search-brand-search-results class="step-search-brand-search-results">
        </div>
        <div>
            <button step-search-brand-add>Add</button>
        </div>
    </div>
</div>
```
Specific elements and attributes in search template:
- Step wrapper element (`<div step-name="searchStep"`)
  - `step-name`, `step-text` and `step-controller` have the same meaning as in clickable items template
  - `step-search-brand-search-path` - the search path the library must request when the user types something in the search box. For example the path to `php` script that will perform the search in the database and will return the results
    - `<input step-search-brand-input` - input element used by the controller to send its content and other steps selections to the server when the user types something in it
    - `<div step-search-brand-search-results` - (this is still not used) - the element that will contain the seach results
    - `<button step-search-brand-add` - (this is still not used) - button which is used to add the selected element from the results to the "basket"

### Breadcrubm HTML template sample
Breadcrumb is usually put above the steps:
```html
<div steps-breadcrumb class="steps-breadcrumb">
    <div steps-breadcrumb-item>
        <span steps-breadcrumb-item-text class="steps-breadcrumb-item-text"></span>
        <span steps-breadcrumb-item-separator class="steps-breadcrumb-item-separator">&gt;</span>
    </div>
</div>
```
Specific elements and attributes in breadcrumb template:
- `<div steps-breadcrumb` - breadcrumb wrapper element
  - `<div steps-breadcrumb-item>` - breadcrumb item element wrapper - wraps the step text and separator (the symbol between steps in the breadcrmb)
    - `<span steps-breadcrumb-item-text` - element containing the value of `step-name` attribute
    - `<span steps-breadcrumb-item-separator` - element containing the separator between steps. In the above sample this is simply greater than symbol `>`

## What is sent to the server
The values specified in `step-clickable-item-data` attributes of clicked elements as well as search text typed in the brand search box are wrapped in an object and sent to the server. Sample of this object looks like this:
```json
{
  "searchText": "Versace",
  "stepsSelections": {
    "genderStep": {
      "selected": "male"
    },
    "maleStep": {
      "selected": "outdoor-clothes"
    },
    "maleOutdoorStep": {
      "selected": "coat"
    }
  }
}
```
The above object represents 3 steps selections. The names of the steps defined in `step-name` attributes are keys of the `stepsSelections` object (`genderStep`, `maleStep`, `maleOutdoorStep`) and the values of these keys are the values set in the attribute `step-clickable-item-data` of the elements that were clicked. In the sample above the data attributes contain JSON objects (`step-clickable-item-data='{"selected":"male"}'`, `step-clickable-item-data='{"selected":"outdoor-clothes"}'` and `step-clickable-item-data='{"selected":"coat"}'`) but they can be strings or numbers. Here is how this object will look like if `step-clickable-item-data` attributes contained just the string values (like `step-clickable-item-data="male"`):
```json
{
  "searchText": "Versace",
  "stepsSelections": {
    "genderStep": "male",
    "maleStep": "outdoor-clothes",
    "maleOutdoorStep": "coat"
  }
}
```
The clickable item attribute `step-clickable-item-data` controls what kind of data will be set for the step it is defined in when clicked. You can have different kinds of data for different clickable items - for example one of the items can have string, another one number and another one JSON object.

## Custom templates and controllers
Custom templates must have the following mandatory attributes - `step-name`, `step-text` and `step-controller`.
In order for the library to use custom controller, its constructor function must be available at `window` level. The way library creates instances of non built in controllers is the following:
```javascript
new window[controllerName]()
```
The cotrollers must implement a single function named `init`, which the library will call after controller instance is created. This is the definition of the function:
```javascript
init(containerEl, data, stepCompletedCallback, manager)
```
Parameters that library passes to `init` finction:
- `containerEl` - the container HTML element marked with `step-name` and `step-controller`.
- `data` - not used - library passes `null`
- `stepCompletedCallback` - callback that the controller must execute after the step completes. The parameters that controller must pass are:
  - `stepName` - the name of the step. Controller can get this when the library calls its `init` function (inspecting attribute `step-name` of the passed `continerEl` parameter)
  - `stepResult` - any value representing the result of completing the step (for example clickable items sets this to the value ot `step-clickable-item-data` attribute of the clicked element)
  - `nextStepName` - the name of the next step
- `manager` - this is the manager class instance that manages the step group. The controller can use it to get the entire object representing all the step selections until now (by calling `manager.getStepsDataObject()`) - this is used by the search controller in order to construct the object to send to the server when searching.

`stepCompletedCallback` must be caled from the controller like this:
```javascript
stepCompletedCallback(stepName, stepResult, nextStepName);
```

