import { combineLatest as observableCombineLatest, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { RemoteDataBuildService } from '../../../../core/cache/builders/remote-data-build.service';
import { FilterType } from '../../../search-service/filter-type.model';
import { renderFacetFor } from '../search-filter-type-decorator';
import {
  facetLoad,
  SearchFacetFilterComponent
} from '../search-facet-filter/search-facet-filter.component';
import { SearchFilterConfig } from '../../../search-service/search-filter-config.model';
import { FILTER_CONFIG, IN_PLACE_SEARCH, SearchFilterService } from '../search-filter.service';
import { SearchService } from '../../../search-service/search.service';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { RouteService } from '../../../../core/services/route.service';
import { hasValue } from '../../../../shared/empty.util';
import { SearchConfigurationService } from '../../../search-service/search-configuration.service';
import { SEARCH_CONFIG_SERVICE } from '../../../../+my-dspace-page/my-dspace-page.component';

/**
 * The suffix for a range filters' minimum in the frontend URL
 */
export const RANGE_FILTER_MIN_SUFFIX = '.min';

/**
 * The suffix for a range filters' maximum in the frontend URL
 */
export const RANGE_FILTER_MAX_SUFFIX = '.max';

/**
 * The date formats that are possible to appear in a date filter
 */
const dateFormats = ['YYYY', 'YYYY-MM', 'YYYY-MM-DD'];

/**
 * This component renders a simple item page.
 * The route parameter 'id' is used to request the item it represents.
 * All fields of the item that should be displayed, are defined in its template.
 */
@Component({
  selector: 'ds-search-range-filter',
  styleUrls: ['./search-range-filter.component.scss'],
  templateUrl: './search-range-filter.component.html',
  animations: [facetLoad]
})

/**
 * Component that represents a range facet for a specific filter configuration
 */
@renderFacetFor(FilterType.range)
export class SearchRangeFilterComponent extends SearchFacetFilterComponent implements OnInit, OnDestroy {
  /**
   * Fallback minimum for the range
   */
  min = 1950;

  /**
   * Fallback maximum for the range
   */
  max = 2018;

  /**
   * The current range of the filter
   */
  range;

  /**
   * Subscription to unsubscribe from
   */
  sub: Subscription;

  constructor(protected searchService: SearchService,
              protected filterService: SearchFilterService,
              protected router: Router,
              protected rdbs: RemoteDataBuildService,
              @Inject(SEARCH_CONFIG_SERVICE) public searchConfigService: SearchConfigurationService,
              @Inject(IN_PLACE_SEARCH) public inPlaceSearch: boolean,
              @Inject(FILTER_CONFIG) public filterConfig: SearchFilterConfig,
              @Inject(PLATFORM_ID) private platformId: any,
              private route: RouteService) {
    super(searchService, filterService, rdbs, router, searchConfigService, inPlaceSearch, filterConfig);

  }

  /**
   * Initialize with the min and max values as configured in the filter configuration
   * Set the initial values of the range
   */
  ngOnInit(): void {
    super.ngOnInit();
    this.min = moment(this.filterConfig.minValue, dateFormats).year() || this.min;
    this.max = moment(this.filterConfig.maxValue, dateFormats).year() || this.max;
    const iniMin = this.route.getQueryParameterValue(this.filterConfig.paramName).pipe(
      map((range: string) => {
        const regex = /\[(\d+) TO (\d+)]/g;
        const result = regex.exec(range);
        return (Array.isArray(result) && result[1]) ? result[1] : undefined;
      }),
      startWith(undefined));
    const iniMax = this.route.getQueryParameterValue(this.filterConfig.paramName).pipe(
      map((range: string) => {
        const regex = /\[(\d+) TO (\d+)]/g;
        const result = regex.exec(range);
        return (Array.isArray(result) && result[2]) ? result[3] : undefined;
      }),
      startWith(undefined));
    this.sub = observableCombineLatest(iniMin, iniMax).pipe(
      map(([min, max]) => {
        const minimum = hasValue(min) ? min : this.min;
        const maximum = hasValue(max) ? max : this.max;
        return [minimum, maximum]
      })
    ).subscribe((minmax) => this.range = minmax);
  }

  /**
   * Submits new custom range values to the range filter from the widget
   */
  onSubmit() {
    const newMin = this.range[0] !== this.min ? [this.range[0]] : this.min;
    const newMax = this.range[1] !== this.max ? [this.range[1]] : this.max;
    const range = `[${newMin} TO ${newMax}]`;
    this.router.navigate([this.getSearchLink()], {
      queryParams:
        {
          [this.filterConfig.paramName]: range
        },
      queryParamsHandling: 'merge'
    });
    this.filter = '';
  }

  /**
   * TODO when upgrading nouislider, verify that this check is still needed.
   * Prevents AoT bug
   * @returns {boolean} True if the platformId is a platform browser
   */
  shouldShowSlider(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Unsubscribe from all subscriptions
   */
  ngOnDestroy() {
    super.ngOnDestroy();
    if (hasValue(this.sub)) {
      this.sub.unsubscribe();
    }
  }
}
