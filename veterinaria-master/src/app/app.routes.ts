import { Routes } from '@angular/router';
import { LoginComponent } from './components/layout/login/login.component';
import { PrincipalComponent } from './components/layout/principal/principal.component';
import { MenuComponent } from './components/layout/menu/menu.component';
import { DashboardComponent } from './components/layout/dashboard/dashboard.component';
import { AnimalListComponent } from './components/entidades/animal/animal-list/animal-list.component';
import { AnimalFormComponent } from './components/entidades/animal/animal-form/animal-form.component';
import { TutorListComponent } from './components/entidades/tutor/tutor-list/tutor-list.component';
import { TutorFormComponent } from './components/entidades/tutor/tutor-form/tutor-form.component';
import { MedicosListComponent } from './components/entidades/medico/medico-list/medico-list.component';
import { MedicoFormComponent } from './components/entidades/medico/medico-form/medico-form.component';
import { VacinaListComponent } from './components/entidades/vacina/vacina-list/vacina-list.component';
import { VacinaFormComponent } from './components/entidades/vacina/vacina-form/vacina-form.component';
import { ConsultaListComponent } from './components/entidades/consulta/consulta-list/consulta-list.component';
import { ConsultaFormComponent } from './components/entidades/consulta/consulta-form/consulta-form.component';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
    { path: "", redirectTo: "login", pathMatch: 'full' },
    { path: "login", component: LoginComponent },
    { 
        path: "admin", 
        component: PrincipalComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'USER_BASICO', 'USER_SISTEMA1', 'USER_SISTEMA2'] }, // Qualquer usuário autenticado
        children: [
            {
                path: "dashboard", 
                component: DashboardComponent
                // Sem guard aqui - já verificou no pai
            },
            { 
                path: "menu", 
                component: MenuComponent
                // Sem guard aqui - já verificou no pai
            },
            
            // ========== SISTEMA 1: Animais e Tutores ==========
            { 
                path: "animais", 
                component: AnimalListComponent
                // USER_BASICO pode ver, mas botões de editar ficarão escondidos
            },
            { 
                path: "animais/new", 
                component: AnimalFormComponent,
                canActivate: [roleGuard],
                data: { roles: ['ADMIN', 'USER_SISTEMA1'] }
            },
            { 
                path: "animais/edit/:id", 
                component: AnimalFormComponent,
                canActivate: [roleGuard],
                data: { roles: ['ADMIN', 'USER_SISTEMA1'] }
            },
            { 
                path: "tutores", 
                component: TutorListComponent
                // USER_BASICO pode ver, mas botões de editar ficarão escondidos
            },
            { 
                path: "tutores/new", 
                component: TutorFormComponent,
                canActivate: [roleGuard],
                data: { roles: ['ADMIN', 'USER_SISTEMA1'] }
            },
            { 
                path: "tutores/edit/:id", 
                component: TutorFormComponent,
                canActivate: [roleGuard],
                data: { roles: ['ADMIN', 'USER_SISTEMA1'] }
            },
            
            // ========== Médicos: Sistema1 e Sistema2 podem visualizar, Sistema2 edita ==========
            { 
                path: "medicos", 
                component: MedicosListComponent,
                canActivate: [roleGuard],
                data: { roles: ['ADMIN', 'USER_SISTEMA1', 'USER_SISTEMA2'] }
            },
            { 
                path: "medicos/new", 
                component: MedicoFormComponent,
                canActivate: [roleGuard],
                data: { roles: ['ADMIN', 'USER_SISTEMA2'] }
            },
            { 
                path: "medicos/edit/:id", 
                component: MedicoFormComponent,
                canActivate: [roleGuard],
                data: { roles: ['ADMIN', 'USER_SISTEMA2'] }
            },
            
            // ========== Consultas: Todos podem ver, Sistema1 e Sistema2 editam ==========
            { 
                path: "consultas", 
                component: ConsultaListComponent
                // USER_BASICO pode ver, mas botões de editar ficarão escondidos
            },
            { 
                path: "consultas/new", 
                component: ConsultaFormComponent,
                canActivate: [roleGuard],
                data: { roles: ['ADMIN', 'USER_SISTEMA1', 'USER_SISTEMA2'] }
            },
            { 
                path: "consultas/edit/:id", 
                component: ConsultaFormComponent,
                canActivate: [roleGuard],
                data: { roles: ['ADMIN', 'USER_SISTEMA1', 'USER_SISTEMA2'] }
            },
            
            // ========== Vacinas: Todos podem ver, apenas ADMIN edita ==========
            { 
                path: "vacinas", 
                component: VacinaListComponent
                // Todos podem ver, mas botões de editar só aparecem para ADMIN
            },
            { 
                path: "vacinas/new", 
                component: VacinaFormComponent,
                canActivate: [roleGuard],
                data: { roles: ['ADMIN'] }
            },
            { 
                path: "vacinas/edit/:id", 
                component: VacinaFormComponent,
                canActivate: [roleGuard],
                data: { roles: ['ADMIN'] }
            }
        ]
    },
    { path: "**", redirectTo: "login" }
];
