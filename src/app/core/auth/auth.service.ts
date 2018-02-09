import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/Observable';

import { Eperson } from '../eperson/models/eperson.model';
import { AuthRequestService } from './auth-request.service';
import { HttpHeaders } from '@angular/common/http';
import { HttpOptions } from '../dspace-rest-v2/dspace-rest-v2.service';
import { AuthStatus } from './models/auth-status.model';
import { AuthTokenInfo } from './models/auth-token-info.model';
import { isNotEmpty, isNotNull } from '../../shared/empty.util';
import { AuthStorageService } from './auth-storage.service';

export const MOCK_USER = new Eperson();
MOCK_USER.id = '92a59227-ccf7-46da-9776-86c3fc64147f';
MOCK_USER.uuid = '92a59227-ccf7-46da-9776-86c3fc64147f';
MOCK_USER.name = 'andrea.bollini@4science.it';
MOCK_USER.email = 'andrea.bollini@4science.it';
MOCK_USER.metadata = [
  {
    key: 'eperson.firstname',
    value: 'Andrea',
    language: null
  },
  {
    key: 'eperson.lastname',
    value: 'Bollini',
    language: null
  },
  {
    key: 'eperson.language',
    value: 'en',
    language: null
  }
];

export const TOKENITEM = 'dsAuthInfo';

/**
 * The auth service.
 */
@Injectable()
export class AuthService {

  /**
   * True if authenticated
   * @type boolean
   */
  private _authenticated = false;

  /**
   * The url to redirect after login
   * @type string
   */
  private _redirectUrl: string;

  constructor(private authRequestService: AuthRequestService, private storage: AuthStorageService) {
  }

  /**
   * Authenticate the user
   *
   * @param {string} user The user name
   * @param {string} password The user's password
   * @returns {Observable<User>} The authenticated user observable.
   */
  public authenticate(user: string, password: string): Observable<AuthStatus> {
    // Normally you would do an HTTP request to determine to
    // attempt authenticating the user using the supplied credentials.
    // const body = `user=${user}&password=${password}`;
    // const body = encodeURI('password=test&user=vera.aloe@mailinator.com');
    // const body = [{user}, {password}];
    // const body = encodeURI('password=' + password.toString() + '&user=' + user.toString());
    const body = encodeURI(`password=${password}&user=${user}`);
    const options: HttpOptions = Object.create({});
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/x-www-form-urlencoded');
    options.headers = headers;
    options.responseType = 'text';
    return this.authRequestService.postToEndpoint('login', body, options)
      .map((status: AuthStatus) => {
        if (status.authenticated) {
          return status;
        } else {
          throw(new Error('Invalid email or password'));
        }
      })

  }

  /**
   * Determines if the user is authenticated
   * @returns {Observable<boolean>}
   */
  public authenticated(): Observable<boolean> {
    return Observable.of(this._authenticated);
  }

  /**
   * Returns the authenticated user
   * @returns {User}
   */
  public authenticatedUser(token: AuthTokenInfo): Observable<Eperson> {
    // Normally you would do an HTTP request to determine if
    // the user has an existing auth session on the server
    // but, let's just return the mock user for this example.
    const options: HttpOptions = Object.create({});
    let headers = new HttpHeaders();
    headers = headers.append('Accept', 'application/json');
    headers = headers.append('Authorization', `Bearer ${token.accessToken}`);
    options.headers = headers;
    return this.authRequestService.getRequest('status', options)
      .map((status: AuthStatus) => {
        if (status.authenticated) {
          this._authenticated = true;
          return status.eperson[0];
        } else {
          this._authenticated = false;
          throw(new Error('Not authenticated'));
        }
      });
  }

  /**
   * Create a new user
   * @returns {User}
   */
  public create(user: Eperson): Observable<Eperson> {
    // Normally you would do an HTTP request to POST the user
    // details and then return the new user object
    // but, let's just return the new user for this example.
    this._authenticated = true;
    return Observable.of(user);
  }

  /**
   * End session
   * @returns {Observable<boolean>}
   */
  public signout(): Observable<boolean> {
    // Normally you would do an HTTP request sign end the session
    // but, let's just return an observable of true.
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/x-www-form-urlencoded');
    const options: HttpOptions = Object.create({headers, responseType: 'text'});
    return this.authRequestService.getRequest('logout', options)
      .map((status: AuthStatus) => {
        if (!status.authenticated) {
          this._authenticated = false;
          return true;
        } else {
          throw(new Error('Invalid email or password'));
        }
      })

  }

  public getAuthHeader(): string {
    // Retrieve authentication token info
    const token = this.storage.get(TOKENITEM);
    return (isNotNull(token) && this._authenticated) ? `Bearer ${token.accessToken}` : '';
  }

  public getToken(): AuthTokenInfo {
    // Retrieve authentication token info
    return this.storage.get(TOKENITEM);
  }

  public storeToken(token: AuthTokenInfo) {
    // Save authentication token info
    return this.storage.store(TOKENITEM, JSON.stringify(token));
  }

  public removeToken() {
    // Remove authentication token info
    return this.storage.remove(TOKENITEM);
  }

  get redirectUrl(): string {
    return this._redirectUrl;
  }

  set redirectUrl(value: string) {
    this._redirectUrl = value;
  }
}