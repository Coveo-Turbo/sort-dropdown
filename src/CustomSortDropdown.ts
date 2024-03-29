import { Component, IComponentBindings, ComponentOptions, $$, l } from 'coveo-search-ui';
import { lazyComponent } from '@coveops/turbo-core';

export interface ICustomSortDropdownOptions {
  caption: string;
  header: string;
  description: string;
  displayCaption?: boolean;
  displayAsSelect?: boolean;
  displayHeader?: boolean;
  displayDescription?: boolean;
}

@lazyComponent
export class CustomSortDropdown extends Component {
  static ID = 'CustomSortDropdown';
  static options: ICustomSortDropdownOptions = {
    caption: ComponentOptions.buildLocalizedStringOption({ localizedString: () => l('SortBy') }),
    header: ComponentOptions.buildStringOption({ defaultValue: 'Sort' }),
    description: ComponentOptions.buildStringOption({ defaultValue: 'Your results will populate after a selection is made from the dropdown below.' }),
    displayCaption: ComponentOptions.buildBooleanOption({ defaultValue: false }),
    displayAsSelect: ComponentOptions.buildBooleanOption({ defaultValue: false }),
    displayHeader: ComponentOptions.buildBooleanOption({ defaultValue: false }),
    displayDescription: ComponentOptions.buildBooleanOption({ defaultValue: false })
  };

  private currentSearchSort: string;
  private select: HTMLSelectElement;
  private selectStyled: Coveo.Dom;
  private listOptions: Coveo.Dom;

  constructor(public element: HTMLElement, public options: ICustomSortDropdownOptions, public bindings: IComponentBindings) {
    super(element, CustomSortDropdown.ID, bindings);
    this.options = ComponentOptions.initComponentOptions(element, CustomSortDropdown, options);
    // Init Events
    this.bind.onRootElement(Coveo.InitializationEvents.afterInitialization, this.handleAfterInit);

    // State Events
    let changeSortEvtName = this.getStateEventName(Coveo.QueryStateModel.eventTypes.changeOne + Coveo.QueryStateModel.attributesEnum.sort);
    let changeTabEvtName = this.getStateEventName(Coveo.QueryStateModel.eventTypes.changeOne + Coveo.QueryStateModel.attributesEnum.t);
    this.bind.onRootElement(changeSortEvtName, (args: Coveo.IAttributeChangedEventArg) => this.handleCoveoStateChanged(args));
    this.bind.onRootElement(changeTabEvtName, (args: Coveo.IAttributeChangedEventArg) => this.handleTabChange(args));

    // Query Events
    this.bind.onRootElement(Coveo.QueryEvents.querySuccess, (args: Coveo.IQuerySuccessEventArgs) => this.handleQuerySuccess(args));
    this.bind.onRootElement(Coveo.QueryEvents.queryError, (args: Coveo.IQueryErrorEventArgs) => this.handleQueryError(args));
    if (this.options.displayHeader) {
      Coveo.$$(this.element).append(this.buildHeader());
    }
    if (this.options.displayDescription) {
      Coveo.$$(this.element).append(this.buildDescription());
    }
    if (this.options.displayCaption) {
      Coveo.$$(this.element).append(this.buildLabel());
    }
    this.select = this.buildSelectElement();
    if (!this.options.displayAsSelect) {
      Coveo.$$(this.select).addClass('coveo-custom-select-hidden');
    }
    Coveo.$$(this.element).append(this.select);
  }

  private handleCoveoStateChanged(args: Coveo.IAttributeChangedEventArg) {
    if (args.value !== this.currentSearchSort) {
      this.currentSearchSort = args.value;
      this.reset();
    }
  }

  private handleQuerySuccess(data: Coveo.IQuerySuccessEventArgs) {
    if (data.results.results.length == 0) {
      $$(this.element).addClass('coveo-sort-hidden');
    } else {
      $$(this.element).removeClass('coveo-sort-hidden');
    }
  }

  private handleQueryError(data: Coveo.IQueryErrorEventArgs) {
    $$(this.element).addClass('coveo-sort-hidden');
  }

  private getStateEventName(event: string) {
    return Coveo.QueryStateModel.ID + ':' + event;
  }

  private reset() {
    this.buildSelectOptions();
    if (!this.options.displayAsSelect) {
      this.buildStyledSelect();
    }
  }
  private handleAfterInit() {
    this.reset();
  }

  private handleTabChange(args: Coveo.IAttributeChangedEventArg) {
    this.reset();
  }

  private buildStyledSelect() {
    // remove previous UI if any (it can happen if buildStyledSelect() is called multiple times).
    const previousElements = this.select.parentNode.querySelectorAll('.coveo-custom-select,.coveo-custom-select-styled,.coveo-custom-select-options');
    previousElements.forEach(el => {
      el.parentNode.removeChild(el);
    });

    const wrapper = Coveo.$$('div', { className: 'coveo-custom-select' });
    this.select.parentNode.insertBefore(wrapper.el, this.select);
    wrapper.append(this.select);
    this.selectStyled = Coveo.$$('div', { className: 'coveo-custom-select-styled' });
    this.listOptions = Coveo.$$('ul', { className: 'coveo-custom-select-options' });
    wrapper.append(this.selectStyled.el);
    wrapper.append(this.listOptions.el);
    this.renderSelectStyled();

    this.selectStyled.on('click', (e) => {
      e.stopPropagation();
      this.selectStyled.toggleClass('active');
      this.listOptions.toggle();
    });

    document.addEventListener('click', () => {
      this.selectStyled.removeClass('active');
      this.listOptions.hide();
    });
  }

  private renderSelectStyled() {
    const self = this;
    self.listOptions.empty();
    // Hack for Typescript issue
    var opt: any = this.select.options;
    const current = opt.length ? opt[self.select.selectedIndex].text : '';
    self.selectStyled.text(current);

    for (var i = 0; i < opt.length; i++) {
      const listItem = Coveo.$$('li', {
        value: opt.item(i).value
      }, opt.item(i).text);
      self.listOptions.append(listItem.el);

      if (current == opt.item(i).text) {
        listItem.addClass('active');
      }
      listItem.on('click', (e) => {
        e.stopPropagation();
        self.select.value = listItem.getAttribute('value');
        self.updateSort(listItem.getAttribute('value'));
        self.selectStyled.text(listItem.text());
        self.selectStyled.removeClass('active');
        _.each(self.listOptions.children(), (li) => { Coveo.$$(li).removeClass('active'); });
        listItem.addClass('active');
        self.listOptions.hide();
      });
    }
  }

  private buildHeader() {
    const header = Coveo.$$('span', { className: 'coveo-custom-sort-header' }, this.options.header).el;
    return header;
  }

  private buildDescription() {
    const description = Coveo.$$('span', { className: 'coveo-custom-sort-description' }, this.options.description).el;
    return description;
  }

  private buildLabel() {
    const label = Coveo.$$('span', { className: 'coveo-custom-sort-dropdown-text' }, this.options.caption).el;
    return label;
  }

  private buildSelectElement() {
    const selectEl = Coveo.$$('select', { className: 'coveo-custom-sort-dropdown-picker' });
    const changeAction = () => this.handleSelectChangeCriteria();
    selectEl.on('change', changeAction);
    return <HTMLSelectElement>selectEl.el;
  }

  private buildSelectOptions() {
    Coveo.$$(this.select).empty();
    let sorts = this.element.querySelectorAll('.CoveoSort:not(.coveo-tab-disabled):not(.coveo-sort-hidden)');
    _.each(sorts, (Sort) => {
      const sort = <Coveo.Sort>Coveo.get(<HTMLElement>Sort, 'Sort');
      let selectedOption: boolean;
      sort.options.sortCriteria.forEach(crit => {
        const key = (crit.sort + ' ' + crit['direction']).trim();
        if (key == this.currentSearchSort) {
          selectedOption = true;
        }
      });

      const optionLink = <HTMLOptionElement>Coveo.$$('option', { value: sort.options.caption }, sort.options.caption).el;
      if (selectedOption) {
        optionLink.selected = true;
      }
      Coveo.$$(this.select).append(optionLink);
    });
  }
  private handleSelectChangeCriteria() {
    var sortCaption = (<HTMLSelectElement>(event.currentTarget)).value;
    this.updateSort(sortCaption);
  };

  private updateSort(value: string) {
    let sorts = this.element.querySelectorAll('.CoveoSort:not(.coveo-tab-disabled):not(.coveo-sort-hidden)');
    _.each(sorts, (Sort) => {
      const sort = <Coveo.Sort>Coveo.get(<HTMLElement>Sort, 'Sort');
      if (value == sort.options.caption) {
        sort.element.click();
      }
    });
  }
}
