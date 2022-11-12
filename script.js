'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

/////////////////////////////////////////////////////////////////////////////////////////////

//geo location API

class workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  // clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; //in km
    this.duration = duration; // in min
  }
  //weheever the new object is created the  description will be set
  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  // click() {
  //   this.clicks++;
  // }
}

class Running extends workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.type = 'running';
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min / km
    this.pace = this.duration / this.distance;
    return;
  }
}

class Cycling extends workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.type = 'cycling';
    this.calcSpeed();
    //through the constructor method this constructer will get the access to all the method of it's parent class
    this._setDescription();
  }

  calcSpeed() {
    //  km / min
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #check; // thsese are private instances
  #workouts = [];
  #mapZoomLevel = 12;

  constructor() {
    this._getPosition();
    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toogleElevateField.bind(this));

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  ///////////////////////////////////////////////////////////////////

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          // if first fxn is false then it will run
          console.log("couldn't get your location");
        }
      );
  }

  ///////////////////////////////////////////////////////////////////

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    //console.log(this.#map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    //render markup afer loadinf the data from local storage
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  ///////////////////////////////////////////////////////////////////

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  ///////////////////////////////////////////////////////////////////
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.remove('hidden');

    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toogleElevateField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    this.#check = !this.#check;
  }

  ///////////////////////////////////////////////////////////////////

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();
    //get the data from form
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //if activity running , create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Input have to be positive Number');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //if activity cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Input have to be positive Number');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // add new object to workout array
    this.#workouts.push(workout);
    console.log(this.#workouts);
    // console.log(workout);

    //render workout on map as marker
    this._renderWorkoutMarker(workout);

    //render workout on the list
    this._renderWorkout(workout);

    //hide form and clear i/p fields
    this._hideForm();

    this._setLocalStorage();

    //display Marker
    // console.log(this.#mapEvent);
  } // _newworkout boundry ends here

  ///////////////////////////////////////////////////////////

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  ///////////////////////////////////////////////////////////////////////

  _renderWorkout(workout) {
    let html = `
    <li class="workout dash workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
      </div>
      </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
         </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    // console.log(workoutEl);

    //gaurd class
    if (!workoutEl) return;

    const triggerThis = this.#workouts.find(
      work => work.id == workoutEl.dataset.id
    );
    //  console.log(triggerThis);

    this.#map.setView(triggerThis.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // triggerThis.click();
  }

  _setLocalStorage() {
    // LOCALSTORAGE = its a very simple api
    //Disclaimer -  we don't haev to use large amount of data , bcz large amount of data storing in local storage will slow down our page

    localStorage.setItem('workouts', JSON.stringify(this.#workouts));

    // local atorage is an api provided by browser , which can store data even after closing the page
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app = new App();
console.log(app);

console.log('use app.reset() to reset all the data');

/////////////-------------------------------------------------Disclaimer------------------------------------//////////////////////

//we lost the prototype chain after storing the data in local storage

/////////////----------------------------------------------------------------------------------------------//////////////////////
