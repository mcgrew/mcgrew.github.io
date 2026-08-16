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
            data[k].readings_on.forEach(r => this.allAnswers.add(r.clean()));
        });
        return data;
    }

    options() {
        const buttons = document.querySelectorAll('button');
        const readings = this.all[this.card].readings_on;
        const possible = [...this.allAnswers].filter(item => !readings.includes(item));
        const options = [...possible.shuffle().slice(0, buttons.length - 1), readings[0]]
        return options.map(o => o.clean()).shuffle();
    }

    answer() {
        return this.all[this.card].readings_on[0];
    }

    cardHTML() {
        const card = this.all[this.card];
        const meaning =  card.wk_meanings[0] || card.meanings[0];
        const altMeaning = card.meanings.filter(m => m != meaning).join(', ')
        const altMeaningStyle = 'font-size:0.16em; height:0.18em; line-height:1.1em;';
        const meaningStyle = 'font-size:0.33em; position:relative; top:0.8em';
        const kanjiStyle = 'margin:-0.1em 0'; 
        return `
        <div style="${altMeaningStyle}">${altMeaning}</div>
        <div style="${meaningStyle}">${meaning}</div>
        <div style="${kanjiStyle}">${this.card}</div>`;
    }

    reveal() {
        super.reveal();
        const readings = this.all[this.card].readings_on.slice(1);
        if (readings.length) {
            document.getElementById('info').innerText = 
                '他の音訓： ' + readings.join('、 ');
        }
    }
}
