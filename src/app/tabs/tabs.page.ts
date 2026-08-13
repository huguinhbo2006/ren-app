import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { keyOutline, cubeOutline, peopleOutline, walletOutline, ellipsisHorizontalOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  standalone: true,
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

  constructor() {
    addIcons({
      'key-outline': keyOutline,
      'cube-outline': cubeOutline,
      'people-outline': peopleOutline,
      'wallet-outline': walletOutline,
      'ellipsis-horizontal-outline': ellipsisHorizontalOutline,
    });
  }
}
