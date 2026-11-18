import {Quiz} from '../resources/quiz.js';

export class OnyomiQuiz extends Quiz {
    constructor(dataFile, quizName) {
        super(dataFile, quizName || 'onyomi');
    }

    prepareData(data) {
        const keys = Object.keys(data)
        keys.forEach(k => {
            const entry = data[k];
            if (!entry.readings_on.length || !entry.meanings.length)
                delete data[k];
        });
        this.allAnswers = new Set();
        Object.keys(data).forEach(k => {
            this.allAnswers.add(data[k].readings_on[0].clean());
//              data[k].readings_on.forEach(r => this.allAnswers.add(r.clean()));
        });
        return data;
    }

    sorted(keys) {
        return (keys.sort((a, b) => 
            (this.all[a].freq || 9999) - (this.all[b].freq || 9999))[0]);
    }

    options() {
        const buttons = document.querySelectorAll('button');
        const readings = this.all[this.card].readings_on;
        const possible = [...this.allAnswers].filter(item => !readings.includes(item));
        const options = [...possible.shuffle().slice(0, buttons.length - 1), readings[0]]
        return options.map(o => o.clean().katakana()).shuffle();
    }

    answer() {
        return this.all[this.card].readings_on[0];
    }

    cardHTML() {
        return `<div style='font-size: .5em;margin-bottom: -0.8em;'>${this.all[this.card].meanings[0]}</div>
            ${this.card}`;
    }
    reveal() {
        super.reveal();
        const readings = this.all[this.card].readings_on.slice(1);
        if (readings.length) {
            document.getElementById('info').innerText = 
                '他： ' + readings.join('、 ');
        }
    }
}
