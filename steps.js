(() => {
    class StepsManager {
        els = {
            stepsContainer: null,
            breadcrumbContainer: null,
            breadcrumbItem: null,
            allBreadcrumbItems: null,
            allSteps: null
        };
        controllers = [];
        stepsName = '';
        allStepNames = [];
        shownBreadcrumbStepNames = [];
        domHelper = new DOMHelper();
        stepsDataObject = {};

        /**
         * Initializes the class
         * @param {Node} containerEl Parent element containing breadcrumb and steps
         */
        init(containerEl) {
            this.readElements(containerEl);
            this.stepsName = this.domHelper.getAttr(containerEl, 'steps-container');
            this.createControllers();
            this.allStepNames = this.getAllStepNames();
            this.createBreadcrumb();
            this.els.allBreadcrumbItems = this.domHelper.queryAll(this.els.breadcrumbContainer, '[steps-breadcrumb-item]');
            this.shownBreadcrumbStepNames = [this.allStepNames[0]];
            this.showBreadcrumbSteps(this.shownBreadcrumbStepNames);
            this.showStep(this.shownBreadcrumbStepNames[0]);
        }

        /**
         * Reads all children elements of specified parent that are used in this class instance and stores them for future use
         * @param {Node} containerElement Parent element
         */
        readElements(containerElement) {
            this.els.stepsContainer = containerElement;
            this.els.breadcrumbContainer = this.domHelper.queryOne(this.els.stepsContainer, '[steps-breadcrumb]');
            this.els.breadcrumbItem = this.domHelper.queryOne(this.els.breadcrumbContainer, '[steps-breadcrumb-item]');
            this.els.allSteps = this.domHelper.queryAll(this.els.stepsContainer, '[step-name]');
        }

        /**
         * Creates breadcrumb elements for all steps (excluding the first one which must already be available) and hides them
         */
        createBreadcrumb() {
            this.setBreadcrumbItem(this.els.breadcrumbItem, this.allStepNames[0], this.domHelper.getAttr(this.els.allSteps.item(0), 'step-text'))
            for (let i = 1; i < this.allStepNames.length; i++) {
                const clonedBreadcrumbItem = this.domHelper.cloneNode(this.els.breadcrumbItem);
                this.setBreadcrumbItem(clonedBreadcrumbItem, this.allStepNames[i], this.domHelper.getAttr(this.els.allSteps.item(i), 'step-text'));
                this.els.breadcrumbContainer.appendChild(clonedBreadcrumbItem);
            }
        }

        /**
         * Sets step name and display text for the specified breadcrumb element
         * @param {Node} element Breadcrumb element with attribute steps-breadcrumb-item
         * @param {*} stepName The name of the stem
         * @param {*} text The display text of the step
         */
        setBreadcrumbItem(element, stepName, text) {
            this.setElementVisibility(element, false);
            this.domHelper.setAttr(element, 'steps-breadcrumb-item-step-name', stepName);
            const itemTextEl = this.domHelper.queryOne(element, '[steps-breadcrumb-item-text]');
            this.domHelper.setText(itemTextEl, text);
        }

        /**
         * Adds steps-hidden class to specified element if isVisible is true and removes it if it is false
         * @param {Node} element 
         * @param {boolean} isVisible 
         */
        setElementVisibility(element, isVisible) {
            const hiddenClassName = 'steps-hidden';
            if (isVisible) {
                this.domHelper.removeClass(element, hiddenClassName);
            } else {
                this.domHelper.addClass(element, hiddenClassName);
            }
        }

        /**
         * Shows all specified steps as breadcrumb
         * @param {string[]} shownSteps 
         */
        showBreadcrumbSteps(shownSteps) {
            // Show all elements with specified names and hide the rest
            let lastVisibleEl;
            for (let i = 0; i < this.els.allBreadcrumbItems.length; i++) {
                const el = this.els.allBreadcrumbItems.item(i);
                const stepName = this.domHelper.getAttr(el, 'steps-breadcrumb-item-step-name');
                const shouldShow = shownSteps.indexOf(stepName) >= 0;
                this.setElementVisibility(el, shouldShow);
                this.setElementVisibility(this.domHelper.queryOne(el, '[steps-breadcrumb-item-separator]'), shouldShow);
                if (shouldShow) {
                    lastVisibleEl = el;
                }
            }
            // Hide the separator of the last item
            this.setElementVisibility(this.domHelper.queryOne(lastVisibleEl, '[steps-breadcrumb-item-separator]'), false);
        }

        /**
         * Reads all elements and gets their step-name attribute values as string array
         * @returns String array containing all step names
         */
        getAllStepNames() {
            const stepNames = [];
            const stepNameEls = this.getAllStepElements();
            stepNameEls.forEach(el => {
                stepNames.push(this.getElementStepName(el));
            });
            return stepNames;
        }

        /**
         * Hides all other steps and shows only specified one
         * @param {string} stepName Step name 
         */
        showStep(stepName) {
            const stepEl = this.findStepElement(stepName)
            if (!stepEl) {
                throw new Error(`Step with name ${stepName} not found`);
            }
            for (let i = 0; i < this.els.allSteps.length; i++) {
                const el = this.els.allSteps.item(i);
                if (el !== stepEl) {
                    this.setElementVisibility(el, false);
                }
            }
            this.setElementVisibility(stepEl, true);
        }

        /**
         * Finds 
         * @param {string} stepName Step name 
         */
        findStepElement(stepName) {
            for (let i = 0; i < this.els.allSteps.length; i++) {
                const stepEl = this.els.allSteps.item(i);
                if (this.domHelper.getAttr(stepEl, 'step-name') === stepName) {
                    return stepEl;
                }
            }
            return undefined;
        }

        /**
         * Returns the element step-name attribute value
         * @param {Node} element Step element
         * @returns String value of the step-name attribute
         */
        getElementStepName(element) {
            const stepName = this.domHelper.getAttr(element, 'step-name');
            return stepName;
        }

        getAllStepElements() {
            const stepNameEls = this.domHelper.queryAll(this.els.stepsContainer, '[step-name]');
            return stepNameEls;
        }

        createControllers() {
            // Find all children with step-controller attribute and create instances of the controller classes
            const stepControllerEls = this.domHelper.queryAll(this.els.stepsContainer, '[step-controller]');
            stepControllerEls.forEach(containerEl => {
                const controllerName = this.domHelper.getAttr(containerEl, 'step-controller');
                const stepName = this.getElementStepName(containerEl);
                if (controllerName && stepName) {
                    if (this.controllers.some(ctrl => ctrl.stepName === stepName)) {
                        throw new Error(`Step with name ${stepName} already exists`);
                    }
                    const controller = this.createControllerInstance(controllerName);
                    controller.init(containerEl, null, (stepName, stepData, element) => this.stepCompleted(stepName, stepData, element));
                    this.controllers.push({ stepName: stepName, controllerName: controllerName, controller: controller });
                } else {
                    throw new Error('Step name or controller name is not provided');
                }
            });
        }

        stepCompleted(stepName, stepData, element) {
            // Step controller reports that it is completed
            const nextStepName = this.domHelper.getAttr(element, 'step-clickable-item-goes-to-step');
            // Maintain steps data object
            this.stepsDataObject[stepName] = stepData;
            this.showStep(nextStepName);
            this.shownBreadcrumbStepNames.push(nextStepName);
            this.showBreadcrumbSteps(this.shownBreadcrumbStepNames);
            console.log(stepName, stepData, nextStepName, this.stepsDataObject);
        }

        createControllerInstance(controllerName) {
            if (!controllerName || !controllerName.trim()) {
                return undefined;
            }
            // TODO: Find a way to create non-global class instance by providing the class name
            let controller;
            if (controllerName === 'ClickableItemsController') {
                controller = new ClickableItemsController();
            } else if (controllerName === 'SearchBrandController') {
                controller = new SearchBrandController();
            }
            return controller;
        }
    }

    class DOMHelper {
        addClass(element, className) {
            if (!element.classList.contains(className)) {
                element.classList.add(className);
            }
        }

        removeClass(element, className) {
            element.classList.remove(className);
        }

        queryOne(parentElement, selector) {
            return parentElement.querySelector(selector);
        }

        queryAll(parentElement, selector) {
            return parentElement.querySelectorAll(selector);
        }

        getAttr(element, attributeName) {
            return element.getAttribute(attributeName);
        }

        setAttr(element, attributeName, value) {
            element.setAttribute(attributeName, value);
        }

        cloneNode(node) {
            return node.cloneNode(true);
        }

        setText(node, text) {
            node.innerText = text;
        }
    }

    // TODO: These classes can be loaded separately
    /**
     * Manages simple step which contains clickable items
     */
    class ClickableItemsController {
        stepName = '';
        init(containerEl, data, stepCompletedCallback) {
            this.stepName = containerEl.getAttribute('step-name');
            // Attach to click event of the clickable elements so we can detect which item was clicked
            const clickableItemsEls = containerEl.querySelectorAll('[step-clickable-item]');
            clickableItemsEls.forEach(el => {
                el.addEventListener('click', event => {
                    const dataAttribute = event.currentTarget.getAttribute('step-clickable-item-data');
                    if (dataAttribute) {
                        const json = JSON.parse(dataAttribute);
                        stepCompletedCallback(this.stepName, json, event.currentTarget);
                    }
                });
            });
        }
    }

    /**
     * Manages search brand step
     */
    class SearchBrandController {
        init(containerEl, data, stepCompletedCallback) {
            //
        }
    }

    // We will support multiple steps containers on single page
    const stepContainerEls = document.querySelectorAll('[steps-container]');
    const allStepsManagers = [];
    stepContainerEls.forEach(x => {
        const stepsManager = new StepsManager();
        stepsManager.init(x);
        allStepsManagers.push(stepsManager);
    });
})();