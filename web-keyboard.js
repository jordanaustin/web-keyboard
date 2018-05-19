import {LitElement, html} from 'https://unpkg.com/@polymer/lit-element@latest/lit-element.js?module';

const priv = Symbol['priv'];

class WebKeyboard extends LitElement {
    static get properties() {
        return {
            forceOpen: Boolean,
            open: Boolean,
            scope: Object
        }
    }

    get mode() {
        return this.useWebKeyboard ? 'none' : 'auto';
    }

    constructor() {
        super();
        this._inputs = [];
        this['priv'] = {
            requestedKeyboardOpen: false,
            keyboardTimer: null
        };
        this.useWebKeyboard = true;
        this.inputObserver = new MutationObserver(this._muCallback.bind(this));
    }

    async connectedCallback() {
        super.connectedCallback();
        if (!this.scope) this.scope = document.body;
        // start observing the scope for new inputs
        this._inputBinder(document.querySelectorAll('input'));
        this.inputObserver.observe(this.scope, { childList: true});

        await this.renderComplete;

        const { shadowRoot: root } = this;

        this.wrapperEl = root.querySelector('.wrapper');
        this.wrapperEl.addEventListener('mousedown', (e) => {
            e.preventDefault()
        });

        this.toggleNativeBtn = root.querySelector('.choose-keyboard');
        this.toggleNativeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.useWebKeyboard) {
                this.useWebKeyboard = false;
                this.closeKeyboard();
            } else {
                this.useWebKeyboard = true;
                this.openKeyboard();
            }
        });

        document.addEventListener('keypress', (e) => {
            const input = this['priv'].activeInput;

            if (e.keyCode === 8) {
                const curValue = input.value;
                const end = input.selectionEnd;
                const start = input.selectionStart;
                const count = (start === end) ? 1 : 0;

                const modStart = (start - count) < 0 ? 0 : start - count;

                input.value = curValue.slice(0, modStart) + curValue.slice(end, curValue.length)
                input.setSelectionRange(modStart, modStart);
            } else {
                this['priv'].activeInput.value += e.key;
            }
        });

        const dispatchKeyClick = ({ key, keyCode, shiftKey }) => {
            const detail = {
                charCode: keyCode,
                key,
                keyCode,
                shiftKey,
                which: keyCode
            };

            document.dispatchEvent(new KeyboardEvent('keypress',  detail));
        };

        const keys = root.querySelectorAll('.keyboard > button');
        keys.forEach((key) => {
            key.addEventListener('click', (event) => {
                const keyCode = parseInt(event.target.getAttribute('key-code'));
                const shiftKey = event.target.getAttribute('shift-key');
                const key = event.target.textContent;
                dispatchKeyClick({ keyCode, shiftKey, key });
            });
        });

        const resizeWrapper = (e) => {
            const yPos = e.touches ? e.touches[0].pageY : e.pageY;
            wrapperEl.style.top = `${yPos}px`;
        };

        const resizer = this.wrapperEl.querySelector('.resizer');
        const moveEvents = ['mousemove', 'touchmove'];

        ['mousedown', 'touchstart'].forEach(event => resizer.addEventListener(event, (e) => {
            moveEvents.forEach(event => document.addEventListener(event, resizeWrapper));

            ['mouseup', 'touchend'].forEach(event => document.addEventListener(event, (e) => {
            moveEvents.forEach(event => document.removeEventListener(event, resizeWrapper));
            }));
        }));
    }

    disconnectedCallback() {
        this.inputObserver.disconnect();
    }

    openKeyboard() {
        const { useWebKeyboard, wrapperEl } = this;
        this['priv'].requestedKeyboardOpen = true;

        if (this.useWebKeyboard && !this.isOpen) {
            this.wrapperEl.style.display = 'flex';
            requestAnimationFrame(() => {
                this.isOpen = true;
                this.wrapperEl.classList.add('show');
            });
        }
    }

    closeKeyboard() {
        this['priv'].requestedKeyboardOpen = false;
        this['priv'].keyboardTimer = requestAnimationFrame(() => {
            if (!this['priv'].requestedKeyboardOpen && !this.forceOpen) {
                this['priv'].keyboardTimer = null;
                this.wrapperEl.classList.remove('show');
                setTimeout(() => {
                    this.isOpen = false;
                    this.wrapperEl.style.display = 'none';
                }, 300);
            }
        });
    }

    chooseKeyboard() {
        console.log('choose!');
    }

    _inputBinder(newInputs) {
        this._inputs = [ ...this._inputs, ...newInputs ];
        newInputs.forEach((input) => {
            input.setAttribute('inputmode', this.mode);
            input.addEventListener('focus', () => {
                this['priv'].activeInput = input;
                this.openKeyboard();
            }, true);

            input.addEventListener('blur', (e) => {
                if (this['priv'].activeInput === input) {
                    this['priv'].activeInput = null;
                }

                this.closeKeyboard();
            });
        });
    }

    _muCallback(mutationsList) {
        for (let mutation of mutationsList) {
            this._inputBinder(mutation.addedNodes);
        }
    }

    _render({
        forceOpen
     }) {
        return html`
        <style>
            .wrapper {
                display: none;
                position: absolute;
                bottom: -2px;
                max-height: 300px;
                min-height: 20vh;
                width: 100%;
                justify-content: center;
                background: black;
                margin-top: 4px;
                will-change: transform, top;
                transform: translateY(110vh);
                transition: transform 300ms ease-in-out;
                box-shadow: 0px 0px 20px 0px rgba(0, 0, 0, 0.24);
                opacity: 0.75;
                border-top: 2px solid teal;
                border-bottom: 2px solid teal;
                padding-bottom: 8px;
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
                margin-top: 8px;
                display: grid;
                min-width: 300px;
                grid-template-columns: 20fr 20fr 20fr 20fr 20fr;
                grid-column-gap: 1px;
                grid-row-gap: 1px;
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
        <div class="wrapper">
        <div class="resizer"></div>
        <section>
            <button class="choose-keyboard">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
                    <path d="M0 0h24v24H0zm0 0h24v24H0z" fill="none"/>
                </svg>
            </button>
        </section>
        <section class="keyboard">
            <button key-code="69" class="e">e</button>
            <button key-code="55">7</button>
            <button key-code="6">8</button>
            <button key-code="57">9</button>
            <button key-code="52">4</button>
            <button key-code="53">5</button>
            <button key-code="54">6</button>
            <button key-code="189">-</button>
            <button key-code="49">1</button>
            <button key-code="50">2</button>
            <button key-code="51">3</button>
            <button key-code="8" class="del">DEL</button>
            <button key-code="187" shift-key="true" class="plus">+</button>
            <button key-code="48" class="zero">0</button>
            <button key-code="190">.</button>
            <button key-code="13" class="return">⏎</button>
        </section>
    </div>`;
    }
}
customElements.define('web-keyboard', WebKeyboard);