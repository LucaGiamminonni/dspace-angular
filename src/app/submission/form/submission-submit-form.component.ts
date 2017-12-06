import {
  ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges,
  ViewChild
} from '@angular/core';
import { Store } from '@ngrx/store';

import { SectionHostDirective } from '../section/section-host.directive';
import { NewSubmissionFormAction } from '../objects/submission-objects.actions';
import { isNotEmpty, isNotUndefined } from '../../shared/empty.util';
import { UploadFilesComponentOptions } from '../../shared/upload-files/upload-files-component-options.model';
import { SubmissionRestService } from '../submission-rest.service';
import { submissionObjectFromIdSelector } from '../selectors';
import { SubmissionObjectEntry } from '../objects/submission-objects.reducer';
import { WorkspaceitemSectionsObject } from '../models/workspaceitem-sections.model';
import { SubmissionDefinitionsModel } from '../../core/shared/config/config-submission-definitions.model';
import { SubmissionState } from '../submission.reducers';

@Component({
  selector: 'ds-submission-submit-form',
  styleUrls: ['./submission-submit-form.component.scss'],
  templateUrl: './submission-submit-form.component.html',
})

export class SubmissionSubmitFormComponent implements OnChanges {
  @Input() collectionId: string;
  @Input() sections: WorkspaceitemSectionsObject;
  @Input() submissionDefinition: SubmissionDefinitionsModel;
  @Input() submissionId: string;

  definitionId: string;
  loading = true;
  uploadFilesOptions: UploadFilesComponentOptions = {
    url: '',
    authToken: null,
    disableMultipart: false,
    itemAlias: null
  };

  @ViewChild(SectionHostDirective) public sectionsHost: SectionHostDirective;

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private store:Store<SubmissionState>,
              private submissionRestService: SubmissionRestService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.collectionId && this.submissionId) {
      this.submissionRestService.getEndpoint('workspaceitems')
        .filter((href: string) => isNotEmpty(href))
        .distinctUntilChanged()
        .subscribe((endpointURL) => {
          this.uploadFilesOptions.url = endpointURL.concat(`/${this.submissionId}`);
          this.definitionId = this.submissionDefinition.name;
          this.store.dispatch(new NewSubmissionFormAction(this.collectionId, this.submissionId, this.sections));
        });
      this.store.select(submissionObjectFromIdSelector(this.submissionId))
        .filter((submission: SubmissionObjectEntry) => isNotUndefined(submission))
        .subscribe((submission: SubmissionObjectEntry) => {
          if (this.loading !== submission.isLoading) {
            this.loading = submission.isLoading;
            this.changeDetectorRef.detectChanges();
          }
        });
    }
  }

  onCollectionChange(collectionId) {
    this.collectionId = collectionId;
  }

}