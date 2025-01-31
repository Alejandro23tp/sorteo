import { Routes } from "@angular/router";
import { HomeComponent } from "./home/home.component";

export const routes : Routes = [
    {
        path: '',
        loadComponent: () => import('../layout/layout.component'),
        children: [
            {
                path: '',
                component: HomeComponent
            },
        
        ]
    }
];

export default routes;