// Colapsar automáticamente las secciones no activas
document.addEventListener('DOMContentLoaded', function() {
  // Función para manejar el estado de los checkboxes
  function setupExerciseCheckboxes() {
    // Seleccionar todos los checkboxes de ejercicios en task lists de Material for MkDocs
    const taskLists = document.querySelectorAll('.md-typeset .task-list-item input[type="checkbox"]');
    
    // Cargar el estado guardado de los checkboxes
    taskLists.forEach((checkbox, index) => {
      // Usar el texto del ejercicio como identificador único
      const exerciseText = checkbox.closest('li').textContent.trim().toLowerCase().replace(/\s+/g, '-');
      const exerciseId = `exercise-${exerciseText}-${index}`;
      
      // Guardar el ID en el dataset para referencia
      checkbox.dataset.exerciseId = exerciseId;
      
      // Cargar el estado guardado
      const savedState = localStorage.getItem(exerciseId);
      if (savedState === 'completed') {
        checkbox.checked = true;
      }
      
      // Agregar evento para guardar el estado cuando cambie
      checkbox.addEventListener('change', function() {
        if (this.checked) {
          localStorage.setItem(exerciseId, 'completed');
        } else {
          localStorage.removeItem(exerciseId);
        }
      });
    });
  }
  
  // Ejecutar la configuración de checkboxes
  setupExerciseCheckboxes();
  // Función para colapsar secciones no activas
  function collapseInactiveSections() {
    // Obtener todas las secciones de navegación
    const sections = document.querySelectorAll('.md-nav__item--section');
    
    sections.forEach(section => {
      // Verificar si la sección está activa
      const isActive = section.classList.contains('md-nav__item--active');
      const hasActiveChild = section.querySelector('.md-nav__item--active');
      
      // Si la sección no está activa ni tiene hijos activos, colapsarla
      if (!isActive && !hasActiveChild) {
        const toggle = section.querySelector('.md-toggle');
        const subnav = section.querySelector('.md-nav');
        
        if (toggle && subnav) {
          toggle.checked = false;
          subnav.style.display = 'none';
        }
      }
    });
  }
  
  // Función para manejar clics en los títulos de las secciones
  function setupSectionToggle() {
    const sectionTitles = document.querySelectorAll('.md-nav__item--section > .md-nav__link');
    
    sectionTitles.forEach(title => {
      title.addEventListener('click', function(e) {
        const section = this.parentElement;
        const toggle = section.querySelector('.md-toggle');
        const subnav = section.querySelector('.md-nav');
        
        if (toggle && subnav) {
          // Alternar el estado
          const isExpanded = toggle.checked;
          
          // Cerrar todas las secciones primero
          document.querySelectorAll('.md-toggle').forEach(t => {
            if (t !== toggle) {
              t.checked = false;
              const nav = t.closest('.md-nav__item--section')?.querySelector('.md-nav');
              if (nav) nav.style.display = 'none';
            }
          });
          
          // Alternar la sección actual
          toggle.checked = !isExpanded;
          subnav.style.display = isExpanded ? 'none' : 'block';
          
          e.preventDefault();
          e.stopPropagation();
        }
      });
    });
  }
  
  // Ejecutar después de un pequeño retraso para asegurar que la navegación esté cargada
  setTimeout(() => {
    collapseInactiveSections();
    setupSectionToggle();
  }, 100);
  
  // También ejecutar cuando cambie la ruta (para SPA)
  document.addEventListener('md-navigate', () => {
    setTimeout(() => {
      collapseInactiveSections();
      setupSectionToggle();
    }, 100);
  });
});
