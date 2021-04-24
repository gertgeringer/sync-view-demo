import React from 'react';
import './App.css';
import { SyncView } from './syncviewcomponent';

export default class App extends React.Component {
  url: string;

  constructor(props: any) {
    super(props);
    this.url = 'https://picsum.photos/500/300'
  }

  public getSiteCollectionUrl(): string | undefined {
    if (window
      && "location" in window
      && "protocol" in window.location
      && "pathname" in window.location
      && "host" in window.location) {
      let baseUrl = window.location.protocol + "//" + window.location.host;
      const pathname = window.location.pathname;
      const siteCollectionDetector = "/sites/";
      if (pathname.indexOf(siteCollectionDetector) >= 0) {
        baseUrl += pathname.substring(0, pathname.indexOf("/", siteCollectionDetector.length));
      }
      console.log(baseUrl);
      return baseUrl;
    }
    return undefined;
  }

  render() {
    return (
      <div className="grid-container">
        <div style={{ gridArea: "one", width: '100%', height: '100%' }}>
          <SyncView config={{ userName: 'mark', imgUrl: this.url, syncServerUrl: this.getSiteCollectionUrl() + "/ws" }}></SyncView >
        </div>
        <div style={{ gridArea: "two", width: '100%', height: '100%' }}>
          <SyncView config={{ userName: 'peter', imgUrl: this.url, syncServerUrl: this.getSiteCollectionUrl() + "/ws" }}></SyncView >
        </div>
        <div style={{ gridArea: "three", width: '100%', height: '100%' }}>
          <SyncView config={{ userName: 'john', imgUrl: this.url, syncServerUrl: this.getSiteCollectionUrl() + "/ws" }}></SyncView >
        </div>
        <div style={{ gridArea: "four", width: '100%', height: '100%' }}>
          <SyncView config={{ userName: 'paul', imgUrl: this.url, syncServerUrl: this.getSiteCollectionUrl() + "/ws" }}></SyncView >
        </div>
      </div>
    );
  }
}
