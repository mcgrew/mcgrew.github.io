import {Quiz} from '../resources/quiz.js';

const $ = document.querySelector.bind(document);

export class MeaningQuiz extends Quiz {
    constructor(dataFile, quizName) {
        super(dataFile, quizName || 'meanings');
//          this.guesses = 1;
    }

    prepareData(data) {
        const keys = Object.keys(data)
        keys.forEach(k => {
            const entry = data[k];
            if (!entry.readings_on.length || !entry.meanings.length)
                delete data[k];
        });
        this.allMeanings = new Set();
        Object.keys(data).forEach(k => {
            if (data[k].wk_meanings)
                data[k].wk_meanings.forEach(r => this.allMeanings.add(r));
            data[k].meanings.forEach(r => this.allMeanings.add(r.clean()));
        });
        return super.prepareData(data);
    }

    options() {
        const count = document.querySelectorAll('button').length;
        const cardInfo = this.all[this.card];
        const possible = [...this.allMeanings].filter(item => !this.meanings.includes(item));
        return [...possible.shuffle().slice(0, count-1), this.meanings[0]]
            .map(o => o.clean()).shuffle();
    }

    populate(pickedKanji) {
        // preload all unique meanings
        const card = this.all[pickedKanji];
        this.meanings = [...card.meanings, ...(card.wk_meanings || [])]
            .map(m => m.clean()).dedupe().shuffle();
        super.populate(pickedKanji);
    }

    answer() {
        return this.meanings[0];
    }

    reveal() {
        super.reveal();
        const card = this.all[this.card];
        const meanings = [...card.meanings, ...(card.wk_meanings || [])]
            .map(m => m.clean()).dedupe()
            .filter(m => m != this.meanings[0])
        if (meanings.length) {
            document.getElementById('info').innerText = 
                meanings.join(', ');
        }
    }

    buttonText(button, value) {
        super.buttonText(button, value);
        const size = value.length > 20 ? 60 / value.length : 3;
        button.style.fontSize = `${size}vh`;
    }
}
