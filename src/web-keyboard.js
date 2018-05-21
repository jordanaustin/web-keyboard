import {LitElement, html} from 'https://unpkg.com/@polymer/lit-element@latest/lit-element.js?module';

let _keyboardTimer = null;

class WebKeyboard extends LitElement {
    static get properties() {
        return {
            forceOpen: Boolean,
            open: Boolean,
            scope: Object,
            canResize: Boolean,
            hapticFeedback: {
                type: Boolean,
                value: true
            ,}
        }
    }

    get mode() {
        return this.useWebKeyboard ? 'none' : 'auto';
    }

    constructor() {
        super();
        this._inputs = [];

        this.canResize = false;
        this.useWebKeyboard = true;
        this.inputObserver = new MutationObserver(this._muCallback.bind(this));
        document.body.addEventListener('keypress', e => this._onKeypress(e));
    }

    async connectedCallback() {
        super.connectedCallback();
        if (!this.scope) this.scope = document.body;
        // start observing the scope for new inputs
        this._inputBinder(document.querySelectorAll('input, textarea'));
        this.inputObserver.observe(this.scope, { childList: true});

        await this.renderComplete;

        const { shadowRoot: root } = this;

        this.wrapperEl = root.querySelector('.wrapper');
        this.toggleNativeBtn = root.querySelector('.choose-keyboard');

        this.toggleNativeBtn.addEventListener('click', () => {
            this._chooseKeyboard();
        });

        [this.wrapperEl, this.toggleNativeBtn].forEach((el) => {
            el.addEventListener('mousedown', e => e.preventDefault());
        });

        const keyEls = root.querySelectorAll('.keyboard > button');
        keyEls.forEach((keyEl) => {
            keyEl.addEventListener('click', (event) => {
                event.preventDefault();
                const keyCode = parseInt(event.target.getAttribute('key-code'));
                const shiftKey = event.target.getAttribute('shift-key');
                const key = event.target.getAttribute('key');
                const isEnterKey = (keyCode === 13);
                const eventName = isEnterKey ? 'keydown' : 'keypress';

                if (navigator.vibrate) {
                    navigator.vibrate([15]);
                }
                document.body.dispatchEvent(new KeyboardEvent(eventName,  { key, keyCode, shiftKey }));
            });
        });

        const resizer = this.wrapperEl.querySelector('.resizer');
        const moveEvents = ['mousemove', 'touchmove'];

        const resizeWrapperEl = (e) => {
            if (this.canResize){
                const yPos = e.touches ? e.touches[0].pageY : e.pageY;
                this.wrapperEl.style.top = `${yPos}px`;
                e.stopPropagation();
            }
        };

        ['mousedown', 'touchstart'].forEach(event => resizer.addEventListener(event, (e) => {
            moveEvents.forEach(moveEvent => document.addEventListener(moveEvent, resizeWrapperEl));

            ['mouseup', 'touchend'].forEach(event => document.addEventListener(event, (e) => {
                moveEvents.forEach(moveEvent => document.removeEventListener(moveEvent, resizeWrapperEl));
            }));
        }));
    }

    disconnectedCallback() {
        this.inputObserver.disconnect();
    }

    openKeyboard() {
        const { useWebKeyboard, wrapperEl } = this;
        this._requestedKeyboardOpen = true;

        if (this.useWebKeyboard && !this.isOpen) {
            this.wrapperEl.style.display = 'flex';
            requestAnimationFrame(() => {
                this.isOpen = true;
                this.wrapperEl.classList.add('show');
            });
        }
    }

    closeKeyboard() {
        this._requestedKeyboardOpen = false;
        _keyboardTimer = requestAnimationFrame(() => {
            if (!this._requestedKeyboardOpen && !this.forceOpen) {
                _keyboardTimer = null;
                this.wrapperEl.classList.remove('show');
                setTimeout(() => {
                    this.isOpen = false;
                    this.wrapperEl.style.display = 'none';
                }, 300);
            }
        });
    }

    _chooseKeyboard() {
        this.useWebKeyboard = !this.useWebKeyboard;
        this._updateInputMode();

        if (!this.useWebKeyboard) {
            this.closeKeyboard();
        } else {
            this.openKeyboard();
        }
    }

    _onKeypress(e) {
        if (!e.isTrusted) {
            const input = this._activeInput;
            const { charCode, key, keyCode, shiftKey, which } = e;

            if (keyCode === 8) {
                const curValue = input.value;
                const end = input.selectionEnd;
                const start = input.selectionStart;
                const count = (start === end) ? 1 : 0;

                const modStart = (start - count) < 0 ? 0 : start - count;

                input.value = curValue.slice(0, modStart) + curValue.slice(end, curValue.length)
                input.setSelectionRange(modStart, modStart);
            } else {
                this._activeInput.value += key;
            }
        }
    }

    async _updateInputMode() {
        if (this._activeInput) {

        }

        this._inputs.forEach(input => input.setAttribute('inputmode', this.mode));
    }

    _inputBinder(newInputs = []) {
        this._inputs = [ ...this._inputs, ...newInputs ];
        newInputs.forEach((input) => {
            input.setAttribute('inputmode', this.mode);
            input.addEventListener('focus', () => {
                this._activeInput = input;
                this.openKeyboard();
            }, true);

            input.addEventListener('blur', () => {
                if (this._activeInput === input) {
                    this._activeInput = null;
                }

                this.closeKeyboard();
            });
        });
    }

    _muCallback(mutationsList) {
        let newInputs = [];
        for (let mutation of mutationsList) {
            for (let node of mutation.addedNodes) {
                if (node.nodeName === 'TEXTAREA' || node.nodeName === 'INPUT') {
                    newInputs.push(node);
                }
            }
        }

        this._inputBinder(newInputs);
    }

    _render({
        forceOpen
     }) {
        return html`
        <style>
            .choose-keyboard {
                bottom: 0;
                position: fixed;
                padding: 0.15em 0.25em;
                z-index: 9999;
                fill: white;
                border: none;
                background: rgb(45,45,45);
            }
            .wrapper {
                z-index: 9990;
                display: none;
                position: fixed;
                bottom: 0;
                max-height: 50vh;
                min-height: 33vh;
                width: 100%;
                justify-content: center;
                background: rgba(0,0,0,0.9);
                will-change: transform, top;
                transform: translateY(110vh);
                transition: transform 300ms ease-in-out;
                pointer-events: none;
            }

            .wrapper.show {
                pointer-events: auto;
                transform: translateY(0);
            }

            .resizer {
                width: 100%;
                height: 14px;
                top: -7px;
                position: absolute;
                cursor: row-resize;
            }

            .keyboard {
                display: grid;
                min-width: 300px;
                grid-template-columns: 20fr 20fr 20fr 20fr 20fr;
                grid-column-gap: 1px;
                grid-row-gap: 1px;
            }

            .keyboard > button {
                color: white;
                font-size: 1.15em;
                background: rgb(65,65,65);
                border: none;
                // border-color: rgba(200,200,200,0.8);
            }

            .keyboard > button.darker {
                background: rgb(45,45,45);
            }

            .keyboard > button:active,
            .down {
                background: rgb(55,55,55);
            }

            .e {
                grid-row: 1 / span 2;
            }

            .del {
                grid-column: 5;
                grid-row: 1 / span 2;
            }

            .return {
                grid-column: 5;
                grid-row: 3 / span 2;
            }

            .plus {
                grid-column: 1;
            }

            .zero {
                grid-column: 2 / span 2;
            }
        </style>
        <button class="choose-keyboard">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
                <path d="M0 0h24v24H0zm0 0h24v24H0z" fill="none"/>
            </svg>
        </button>
        <div class="wrapper">
        <div class="resizer"></div>
        <section class="keyboard">
            <button key-code="69" key="e" class="e darker">e</button>
            <button key-code="55" key="7">7</button>
            <button key-code="6" key="8">8</button>
            <button key-code="57" key="9">9</button>
            <button key-code="52" key="4">4</button>
            <button key-code="53" key="5">5</button>
            <button key-code="54" key="6">6</button>
            <button key-code="189" key="-" class="darker">-</button>
            <button key-code="49" key="1">1</button>
            <button key-code="50" key="2">2</button>
            <button key-code="51" key="3">3</button>
            <button key-code="8" key="Backspace" class="del darker">DEL</button>
            <button key-code="187" key="+" shift-key="true" class="plus darker">+</button>
            <button key-code="48" key="0" class="zero">0</button>
            <button key-code="190" key=".">.</button>
            <button key-code="13" key="Enter" class="return darker">⏎</button>
        </section>
    </div>`;
    }
}
customElements.define('web-keyboard', WebKeyboard);