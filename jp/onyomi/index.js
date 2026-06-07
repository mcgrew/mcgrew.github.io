$ = document.querySelector.bind(document);
$id = document.getElementById.bind(document);
$$ = document.querySelectorAll.bind(document);
function shuffle(list) {
    return [...list].sort(() => 0.5 - Math.random());
}
function getOptions(readings) {
    const possible = [...window.readings].filter(item => !new Set(readings).has(item));
    const options = [...shuffle(possible).slice(0, 5), readings[0]]
    return shuffle(options);
}
function getNextKanji() {
    return new Promise((resolve, reject) => {
        kanji.getDue().then(cards => {
            if (cards.length) {
                resolve(shuffle(cards)[0]);
            } else {
                kanji.getNew().then(cards => {
                    if (cards.length) {
                        resolve(shuffle(cards)[0]);
                    } else {
                        reject("No more cards");
                    }
                });
            }
        });
    });
}
function populate() {
    if (!window.readings)
        return setTimeout(populate, 100);
    getNextKanji().then(k => {
        window.card = k;
        const options = getOptions(k.onyomi);
        const answer = $id('answer');
        $id('kanji').innerText = k.kanji;
        $id('meaning').innerText = k.meaning;
        answer.dataset.value = k.onyomi[0];
        answer.innerText = '';
        answer.classList.remove('correct');
        answer.classList.remove('incorrect');
        $$('button').forEach(b => {
            b.classList.remove('correct');
            b.classList.remove('incorrect');
            const value = options.pop();
            b.innerText = value;
            b.dataset.value = value;
        });
    });
}
function checkAnswer(button) {
    const answer = $id('answer')
    const incorrect = $$('button.incorrect').length;
    const k = window.card;
    if (button.dataset.value == answer.dataset.value) {
        answer.innerText = 'CORRECT!';
        answer.className = 'correct';
        button.classList.add('correct');
        if (!incorrect)
            k.repeat = Math.max(k.repeat * 2, 1);
        k.due = Temporal.Now.plainDateISO().add({days: k.repeat}).toString();
        kanji.update(k)
    } else {
        answer.innerText = 'INCORRECT!';
        answer.className = 'incorrect';
        button.classList.add('incorrect');
        if (incorrect == 1) {
            reveal();
            if (k.due) {
                k.repeat = 0;
            }
            k.due = Temporal.Now.plainDateISO().toString();
            kanji.update(k)
            console.log(kanji.getByIndex(k.index));
        }
    }
}
window.addEventListener('load', function() {
    window.readings = new Set();
    kanji.getAll().then(result => {
        result.forEach(c => {
            window.readings.add(c.onyomi[0])
        });
        populate();
    });
    $$('button').forEach(b => {
        b.addEventListener('click', function() { 
            if ($$('button.correct').length) return;
            checkAnswer(this);
        });
    });
    $id('answer').addEventListener( 'click',
        () => {if ($$('button.correct').length) populate()});
});
function reveal() {
    $$('button').forEach(b => {
        if (b.dataset.value == $id('answer').dataset.value) {
            b.classList.add('correct');
        }
    })
}
