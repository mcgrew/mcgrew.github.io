const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);


/** @param repeat how many seconds before the card should repeat.
 */
String.prototype.clean = function() {
    return this.replace(/^[-!^]/g, "");
}

Array.prototype.dedupe = function() {
        return [...new Set(this)];
}

Array.prototype.shuffle = function() {
    return this.sort(() => 0.5 - Math.random());
}

Set.prototype.shuffle = function() {
    return [...this].sort(() => 0.5 - Math.random());
}

HTMLElement.prototype.overflows = function() {
    return (this.scrollWidth > this.clientWidth)
        || (this.scrollHeight > this.clientHeight);
}

export class Quiz {
    constructor(dataFile, quizName) {
        this.correctText = 'Correct!';
        this.incorrectText = 'Incorrect!';
        if (!quizName)
            throw Error('Quiz name is not defined!')
        this.quizName = quizName
        this.guesses = 2;
        fetch(dataFile).then(function(response) {
            if (!response.ok) {
                throw Error('Unable to load question database!')
            }
            response.json().then(function (data) {
                this.loadData(data);
            }.bind(this));
        }.bind(this));
    }

    loadData(data) {
        this.all = this.prepareData(data);
        this.keys = Object.keys(this.all);
        this.scheduled = JSON.parse(localStorage.getItem(this.quizName) || '{}');
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                const button = mutation.target;
                button.style.removeProperty('font-size');
                let size = parseFloat(getComputedStyle(button).fontSize);
                while (button.overflows()) {
                    size *= 0.95
                    button.style.fontSize = `${size}px`;
                }
            });
        });
        // watch for button text changes and adjust the font size
        $$('button').forEach(b => {
            observer.observe(b, {childList: true});
            b.addEventListener('click', function(button) { 
                if ($$('button.correct').length) return;
                this.checkAnswer(button);
            }.bind(this, b));
        });
        $('#answer').addEventListener( 'click', function() {
            if ($$('button.correct').length)
                this.next()
        }.bind(this));
        this.next();
    }

    prepareData(data) {
        return data;
    }

    due() {
        const now = this.nextDue();
        const sched = Object.keys(this.scheduled);
        return sched.filter(k => this.scheduled[k].due < now)
    }

    next() {
        const cards = this.due();
        const due = $('#due');
        if (cards.length) { // nothing due, pick a new one.
            due.style.removeProperty('background-color');
            if (cards.length == Object.keys(this.all).length) {
                due.innerText = '✓';
            } else {
                due.innerText = `${cards.length}`;
            }
            this.populate(cards.shuffle()[0]);
        } else {
            const scheduled = new Set(Object.keys(this.scheduled));
            due.style.backgroundColor = '#00ff00';
            due.innerText = `${scheduled.size}`;
            const keys = this.sorted(this.keys.filter(k => !scheduled.has(k)));
            if (keys.length) {
                this.populate(keys[0]);
            } else {
                this.populate(this.keys.shuffle()[0]);
            }
        }
    }

    sorted(keys) {
        return (keys.sort((a, b) => 
            (this.all[a].freq || 9999) - (this.all[b].freq || 9999))[0]);
    }

    save() {
        localStorage.setItem(this.quizName, JSON.stringify(this.scheduled));
    }

    options() {
        console.error('options() not implemented')
        return [];
    }

    answer() {
        console.error('answer() not implemented')
    }

    cardHTML() {
        return this.card;
    }

    checkAnswer(button) {
        if (button.classList.contains('incorrect') || $$('button.correct').length)
            return;
        const answer = $('#answer');
        const incorrect = $$('button.incorrect').length;
        if (button.dataset.value == answer.dataset.value) {
            answer.innerText = this.correctText;
            answer.className = 'correct';
            button.classList.add('correct');
            this.reveal();
            let sched = this.scheduled[this.card] || {};
            sched.repeat = this.nextRepeat(sched.repeat, incorrect)
            sched.due = this.nextDue(sched.repeat)
            this.scheduled[this.card] = sched;
            this.save()
        } else {
            answer.innerText = this.incorrectText;
            answer.className = 'incorrect';
            button.classList.add('incorrect');
            if (incorrect+1 == this.guesses) {
                this.reveal();
                this.scheduled[this.card] = {
                    due: this.nextDue(),
                    repeat: this.nextRepeat()
                };
                this.save()
            }
        }
    }

    reveal() {
        $$('button').forEach(b => {
            if (b.dataset.value == $('#answer').dataset.value) {
                b.classList.add('correct');
            }
        });
    }

    populate(picked) {
        console.log(`Next: ${picked}`);
        this.card = picked;
        const entry = this.all[this.card];
        const answer = $('#answer');
        $('#card').innerHTML = this.cardHTML();

        $('#info').innerText = ''
        answer.dataset.value = this.answer();
        answer.innerText = '';
        answer.classList.remove('correct');
        answer.classList.remove('incorrect');
        let options = this.options();
        $$('button').forEach(b => {
            b.classList.remove('correct');
            b.classList.remove('incorrect');
            const value = options.pop();
            b.innerText = value;
            b.dataset.value = value;
        });
    }

    nextDue(repeat) {
        return Math.round(new Date().getTime() / 1000) + (repeat || 0);
    }

    nextRepeat(repeat, incorrect) {
        // 3m 15s minimum.
        return Math.max((repeat || 0) * (this.guesses - incorrect), 225)
    }
}
