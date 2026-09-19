import {Quiz} from '../resources/quiz.js';

const $ = document.querySelector.bind(document);

export class KanaQuiz extends Quiz {
    constructor(dataFile, quizName) {
        super(dataFile, quizName || 'kana');
    }

    options() {
        const keys = Object.keys(this.all)
        const count = document.querySelectorAll('button').length;
        const reading = this.all[this.card];
        const possibleKeys = this.keys.filter(k =>
            k.length == this.card.length && k != this.card);
        const possible = [];
        keys.forEach(k => {
            if (possibleKeys.includes(k))
                possible.push(this.all[k]);
        });
        const choices = possible.shuffle().slice(0, count-1);
        choices.push(reading);
        return choices.shuffle()
    }

    answer() {
        return this.all[this.card];
    }
}
