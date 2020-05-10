(() => {
    class StepsManager {
        els: IStepsManagerElements = {
            stepsContainer: null as any,
            breadcrumbContainer: null as any,
            breadcrumbItem: null as any,
            allBreadcrumbItems: null as any,
            allSteps: null as any
        };
        wellKnownControllers = {
            [StepsClickableItemsController.name]: StepsClickableItemsController,
            [StepsSearchBrandController.name]: StepsSearchBrandController
        } as any;
        controllers: any[] = [];
        stepsName = '';
        allStepNames: string[] = [];
        shownBreadcrumbStepNames: string[] = [];
        domHelper = new DOMHelper();
        stepsDataObject: object = {};

        /**
         * Initializes the class
         * @param {Element} containerEl Parent element containing breadcrumb and steps
         */
        init(containerEl: Element): void {
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

        getStepsName(): string {
            return this.stepsName;
        }

        getStepsDataObject(): object {
            return this.stepsDataObject;
        }

        /**
         * Reads all children elements of specified parent that are used in this class instance and stores them for future use
         * @param {Element} containerElement Parent element
         */
        readElements(containerElement: Element): void {
            this.els.stepsContainer = containerElement;
            this.els.breadcrumbContainer = this.domHelper.queryOne(this.els.stepsContainer, '[steps-breadcrumb]')!;
            this.els.breadcrumbItem = this.domHelper.queryOne(this.els.breadcrumbContainer, '[steps-breadcrumb-item]')!;
            this.els.allSteps = this.domHelper.queryAll(this.els.stepsContainer, '[step-name]');
        }

        /**
         * Creates breadcrumb elements for all steps (excluding the first one which must already be available) and hides them
         */
        createBreadcrumb() {
            this.setBreadcrumbItem(this.els.breadcrumbItem, this.allStepNames[0], this.domHelper.getAttr(this.els.allSteps.item(0), 'step-text'));
            for (let i = 1; i < this.allStepNames.length; i++) {
                const clonedBreadcrumbItem = this.domHelper.cloneNode(this.els.breadcrumbItem);
                this.setBreadcrumbItem(clonedBreadcrumbItem as Element, this.allStepNames[i], this.domHelper.getAttr(this.els.allSteps.item(i), 'step-text'));
                this.els.breadcrumbContainer.appendChild(clonedBreadcrumbItem);
            }
        }

        /**
         * Sets step name and display text for the specified breadcrumb element
         * @param {Node} element Breadcrumb element with attribute steps-breadcrumb-item
         * @param {*} stepName The name of the stem
         * @param {*} text The display text of the step
         */
        setBreadcrumbItem(element: Element, stepName: string, text: string): void {
            this.setElementVisibility(element, false);
            this.domHelper.setAttr(element, 'steps-breadcrumb-item-step-name', stepName);
            const itemTextEl = this.domHelper.queryOne(element, '[steps-breadcrumb-item-text]')!;
            this.domHelper.setText(itemTextEl as HTMLInputElement, text);
            element.addEventListener('click', event => this.onBreadcrumbStepClick(event.currentTarget as HTMLInputElement));
        }

        onBreadcrumbStepClick(element: Element): void {
            const stepName = this.domHelper.getAttr(element, 'steps-breadcrumb-item-step-name');
            this.shownBreadcrumbStepNames = this.getBreadcrumbStepsNamesUntil(stepName);
            this.showBreadcrumbSteps(this.shownBreadcrumbStepNames);
            this.cleanUpDataObject();
            this.showStep(stepName);
        }

        getBreadcrumbStepsNamesUntil(stepName: string): string[] {
            const result = [];
            for (const step of this.shownBreadcrumbStepNames) {
                result.push(step);
                if (step === stepName) {
                    break;
                }
            }
            return result;
        }

        cleanUpDataObject(): void {
            // Leave only these items in the data object which are part of breadcrumb path
            // This is needed in case some previous step is selected while the data object
            // already contains the data for a step that was discarded
            const objectKeys = Object.keys(this.stepsDataObject);
            for (const key of objectKeys) {
                if (this.shownBreadcrumbStepNames.indexOf(key) === -1) {
                    // This key does not exist in the breadcrumb - remove it from object
                    delete (this.stepsDataObject as any)[key];
                }
            }
        }

        /**
         * Adds steps-hidden class to specified element if isVisible is true and removes it if it is false
         * @param {Element} element
         * @param {boolean} isVisible
         */
        setElementVisibility(element: Element, isVisible: boolean): void {
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
        showBreadcrumbSteps(shownSteps: string[]): void {
            // Show all elements with specified names and hide the rest
            let lastVisibleEl: Element;
            for (let i = 0; i < this.els.allBreadcrumbItems.length; i++) {
                const el = this.els.allBreadcrumbItems.item(i);
                const stepName = this.domHelper.getAttr(el, 'steps-breadcrumb-item-step-name');
                const shouldShow = shownSteps.indexOf(stepName!) >= 0;
                this.setElementVisibility(el, shouldShow);
                this.setElementVisibility(this.domHelper.queryOne(el, '[steps-breadcrumb-item-separator]')!, shouldShow);
                if (shouldShow) {
                    lastVisibleEl = el;
                }
            }
            // Hide the separator of the last item
            this.setElementVisibility(this.domHelper.queryOne(lastVisibleEl!, '[steps-breadcrumb-item-separator]')!, false);
        }

        /**
         * Reads all elements and gets their step-name attribute values as string array
         * @returns String array containing all step names
         */
        getAllStepNames() {
            const stepNames: string[] = [];
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
        showStep(stepName: string): void {
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
        findStepElement(stepName: string): Element | undefined {
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
        getElementStepName(element: Element): string {
            const stepName = this.domHelper.getAttr(element, 'step-name');
            return stepName;
        }

        getAllStepElements(): NodeListOf<Element> {
            const stepNameEls = this.domHelper.queryAll(this.els.stepsContainer, '[step-name]');
            return stepNameEls;
        }

        createControllers(): void {
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
                    controller.init(
                        containerEl, null,
                        (stepNameParam: string, stepData: object, nextStepName: string) => this.stepCompleted(stepNameParam, stepData, nextStepName),
                        this
                    );
                    this.controllers.push({ stepName: stepName, controllerName: controllerName, controller: controller });
                } else {
                    throw new Error('Step name or controller name is not provided');
                }
            });
        }

        stepCompleted(stepName: string, stepData: object, nextStepName: string) {
            // Step controller reports that it is completed
            // Maintain steps data object
            (this.stepsDataObject as any)[stepName] = stepData;
            if (nextStepName) {
                this.showStep(nextStepName);
                this.shownBreadcrumbStepNames.push(nextStepName);
            }
            this.showBreadcrumbSteps(this.shownBreadcrumbStepNames);
            // this.stepsDataObject contains collected data from all completed steps
        }

        createControllerInstance(controllerName: string): any {
            if (!controllerName || !controllerName.trim()) {
                return undefined;
            }
            // Locally defined well-known controllers have precedence over globally defined ones
            const controllerConstructorFn = this.wellKnownControllers[controllerName];
            if (controllerConstructorFn) {
                return new controllerConstructorFn();
            } else {
                return new (window as any)[controllerName]();
            }
        }
    }

    interface IStepsManagerElements {
        stepsContainer: Element;
        breadcrumbContainer: Element;
        breadcrumbItem: Element;
        allBreadcrumbItems: NodeListOf<Element>;
        allSteps: NodeListOf<Element>;
    }

    class DOMHelper {
        addClass(element: Element, className: string): void {
            element.classList.add(className);
        }

        removeClass(element: Element, className: string): void {
            element.classList.remove(className);
        }

        queryOne(parentElement: Element, selector: string): Element | null {
            return parentElement.querySelector(selector);
        }

        queryAll(parentElement: Element, selector: string): NodeListOf<Element> {
            return parentElement.querySelectorAll(selector);
        }

        getAttr(element: Element, attributeName: string): string {
            return element.getAttribute(attributeName)!;
        }

        setAttr(element: Element, attributeName: string, value: string): void {
            element.setAttribute(attributeName, value);
        }

        cloneNode(node: Node): Node {
            return node.cloneNode(true);
        }

        setText(element: HTMLElement, text: string): void {
            element.innerText = text;
        }
    }

    // TODO: These classes can be loaded separately
    /**
     * Manages simple step which contains clickable items
     */
    class StepsClickableItemsController {
        init(containerEl: Element, data: any, stepCompletedCallback: StepCompletedCallback, manager: StepsManager): void {
            const stepName = containerEl.getAttribute('step-name');
            // Attach to click event of the clickable elements so we can detect which item was clicked
            const clickableItemsEls = containerEl.querySelectorAll('[step-clickable-item]');
            clickableItemsEls.forEach(el => {
                el.addEventListener('click', event => {
                    const currentTargetEl = (event.currentTarget as Element);
                    const dataAttributeValue = currentTargetEl.getAttribute('step-clickable-item-data');
                    if (dataAttributeValue) {
                        let stepResult: any;
                        try {
                            stepResult = JSON.parse(dataAttributeValue);
                        } catch (err) {
                            stepResult = dataAttributeValue;
                        }
                        const nextStepName = currentTargetEl.getAttribute('step-clickable-item-goes-to-step')!;
                        stepCompletedCallback(stepName!, stepResult, nextStepName);
                    }
                });
            });
        }
    }

    /**
     * Manages search brand step
     */
    class StepsSearchBrandController {
        searchPath: string | null = '';
        stepsManager: StepsManager | null = null;
        init(containerEl: Element, data: any, stepCompletedCallback: StepCompletedCallback, manager: StepsManager) {
            this.stepsManager = manager;
            const stepName = containerEl.getAttribute('step-name');
            this.searchPath = containerEl.getAttribute('step-search-brand-search-path');
            const inputEl = containerEl.querySelector('[step-search-brand-input]') as HTMLInputElement;
            inputEl!.addEventListener('input', async event => {
                const textToSearch = (event.target as HTMLInputElement).value;
                if (!textToSearch) {
                    // Clear results
                } else {
                    try {
                        const searchResult = await this.performSearch(this.searchPath!, textToSearch);
                    } catch (err) {
                        // TODO: Show error ?
                    }
                }
            });

            const addBtnEl = containerEl.querySelector('[step-search-brand-add]');
            addBtnEl!.addEventListener('click', async event => {
                // TODO: Add button was clicked
            });
        }

        showSearchResults() {
            // TODO: Add found items
        }

        clearSearchResults() {
            // TODO: Remove all search elements but first one (we need to keep it as a template)
        }

        async performSearch(path: string, text: string): Promise<object> {
            // TODO: Construct real search object for the server and use correct url (it can be provided in the HTML template)
            const stepsDataObject = this.stepsManager?.getStepsDataObject();
            const bodyObj = {
                searchText: text,
                stepsSelections: stepsDataObject
            };
            const respose = await fetch(path, {
                method: 'POST',
                body: JSON.stringify(bodyObj),
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await respose.json();
            return result;
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

    type StepCompletedCallback = (stepName: string, stepResult: any, nextStepName: string) => void
})();

