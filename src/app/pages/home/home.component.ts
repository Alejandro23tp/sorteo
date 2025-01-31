import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { gsap } from 'gsap';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  standalone: true
})
export class HomeComponent implements OnInit {
  names: string[] = [];
  teams: string[][] = [];
  remainingNames: string[] = [];
  usedNames: Set<string> = new Set();
  currentTeamIndex: number = -1; // Inicialmente no hay equipos generados
  totalTeams: number = 0; // Total de equipos posibles (total de jugadores / 2)
  isGenerating: boolean = false;
  isAnimating: boolean = false;
  showSuspense: boolean = false;
  showTeam: boolean = false;
  newName: string = '';

  ngOnInit() {
    gsap.config({ force3D: true });
  }
   // Método para mostrar la animación de suspense
   private async showSuspenseAnimation() {
    this.showSuspense = true;
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simular suspense
    this.showSuspense = false;
    await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa
  }

  // Método para mezclar un arreglo de manera aleatoria
  private shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Método para mostrar el equipo actual con animación
  private async showTeamWithAnimation() {
    await new Promise(resolve => setTimeout(resolve, 100));

    const teamElement = document.getElementById('currentTeam');
    if (!teamElement) return;

    gsap.set(teamElement, { opacity: 1 });
    gsap.set('.team-number', { opacity: 0, y: 20 });
    gsap.set('.team-member', { opacity: 0, y: 20 });

    const tl = gsap.timeline();

    tl.to('.team-number', {
      opacity: 1,
      y: 0,
      duration: 0.5
    });

    tl.to('.team-member', {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.3
    });

    tl.to(teamElement, {
      backgroundColor: 'rgba(219, 234, 254, 0.3)',
      duration: 0.3,
      yoyo: true,
      repeat: 1
    });

    await tl.play();
  }

  
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        this.names = json.slice(1).flat().map(String).filter((name: string) => name.trim() !== '').sort();
        this.remainingNames = [...this.names];
        this.teams = []; // Reiniciar equipos
        this.usedNames.clear(); // Reiniciar nombres usados
        this.currentTeamIndex = -1; // Reiniciar índice
        this.totalTeams = Math.floor(this.names.length / 2); // Calcular total de equipos
      };
      reader.readAsArrayBuffer(file);
    }
  }

  addName() {
    if (this.newName.trim() && !this.names.includes(this.newName)) {
      this.names.push(this.newName.trim());
      this.remainingNames.push(this.newName.trim());
      this.newName = '';
      this.totalTeams = Math.floor(this.names.length / 2); // Actualizar total de equipos
    }
  }

  removeName(name: string) {
    this.names = this.names.filter(n => n !== name);
    this.remainingNames = this.remainingNames.filter(n => n !== name);
    this.usedNames.delete(name);
    this.totalTeams = Math.floor(this.names.length / 2); // Actualizar total de equipos
  }

  shuffleNames() {
    this.names = this.shuffleArray([...this.names]);
    this.remainingNames = [...this.names];
  }

  async generateOrNextTeam() {
    if (this.isAnimating || this.remainingNames.length < 2) return;

    this.isGenerating = true;
    this.isAnimating = true;
    this.showTeam = false;

    await this.showSuspenseAnimation();

    // Generar el siguiente equipo
    this.generateNextTeam();

    this.isGenerating = false;
    this.isAnimating = false;
  }

  generateNextTeam() {
    if (this.remainingNames.length < 2) return;
  
    // Seleccionar dos nombres aleatorios de remainingNames
    const randomIndex1 = Math.floor(Math.random() * this.remainingNames.length);
    const name1 = this.remainingNames[randomIndex1];
  
    // Eliminar el primer nombre seleccionado de remainingNames
    this.remainingNames.splice(randomIndex1, 1);
  
    // Seleccionar el segundo nombre aleatorio
    const randomIndex2 = Math.floor(Math.random() * this.remainingNames.length);
    const name2 = this.remainingNames[randomIndex2];
  
    // Eliminar el segundo nombre seleccionado de remainingNames
    this.remainingNames.splice(randomIndex2, 1);
  
    // Crear el nuevo equipo
    const team = [name1, name2];
    this.teams.push(team);
  
    // Marcar los nombres como usados
    team.forEach(name => this.usedNames.add(name));
  
    // Actualizar el índice del equipo actual
    this.currentTeamIndex = this.teams.length - 1;
    this.showTeam = true;
  
    // Mostrar el equipo con animación
    this.showTeamWithAnimation();
  }

  async regenerateCurrentTeam() {
    if (this.isAnimating || this.currentTeamIndex === -1) return;

    this.isAnimating = true;
    this.showTeam = false;

    await this.showSuspenseAnimation();

    // Devolver los nombres del equipo actual a la lista de nombres disponibles
    const currentTeam = this.teams[this.currentTeamIndex];
    currentTeam.forEach(name => {
      this.remainingNames.push(name);
      this.usedNames.delete(name);
    });

    // Shuffle solo los nombres disponibles (sin tener en cuenta los equipos anteriores)
    const shuffledNames = this.shuffleArray([...this.remainingNames]);

    // Generar un nuevo equipo con los nombres disponibles
    const newTeam = [shuffledNames.pop()!, shuffledNames.pop()!];
    this.teams[this.currentTeamIndex] = newTeam;
    newTeam.forEach(name => this.usedNames.add(name));

    // Actualizar la lista de nombres restantes
    this.remainingNames = shuffledNames;

    this.showTeam = true;
    await this.showTeamWithAnimation();

    this.isAnimating = false;
  }

  downloadCSV() {
    // Equipos formados hasta el momento
    const teamsCSV = this.teams.map(team => team.join(',')).join('\n');
  
    // Nombres pendientes (excluyendo los del equipo actual)
    const pendingNames = this.remainingNames.filter(name => !this.teams[this.currentTeamIndex]?.includes(name)).join('\n');
  
    // Combinar equipos y nombres pendientes en un solo CSV
    const csvData = `Equipos Formados\n${teamsCSV}\n\nNombres Pendientes\n${pendingNames}`;
  
    // Crear el archivo CSV y descargarlo
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'equipos_y_pendientes.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}