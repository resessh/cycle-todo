import 'rxjs/Rx';
import { Observable } from 'rxjs';
import { VNode } from '@cycle/dom';
import { DOMSource } from '@cycle/dom/rxjs-typings';
import { CycleDOMEvent, form, div, input, p, h2, button, span, i, ul, li, makeDOMDriver } from '@cycle/dom';
import { run } from '@cycle/rxjs-run';
import { append, remove, over, lensProp, assoc, compose } from 'ramda';

type So = {
    DOM: DOMSource;
    props?: {};
}

type Si = {
    DOM: Observable<VNode>;
}

type TodoItem = {
    title: string;
    completed: true;
}

type StateAction = (acc: TodoState) => TodoState;
type TodoState = {
    inputValue: string;
    list: TodoItem[];
}

function renderDOM({inputValue, list}: TodoState): VNode {
    return div('.container', [
        div('.row', [
            div('.col-xs-8.col-xs-offset-2', [
                div('.panel.panel-default', [
                    div('.panel-heading', [
                        h2('.panel-title', ['cyclejs todo'])
                    ]),
                    form('.event-add.panel-body.row', [
                        div('.input-group.col-xs-8.col-xs-offset-2.input-group-lg', [
                            input('.event-input.form-control', {
                                props: {
                                    value: inputValue
                                }
                            }),
                            span('.input-group-btn', [
                                input('.add-todo.btn.btn-success', {
                                    attrs: {
                                        type: 'submit'
                                    }
                                }, [
                                    i('.fa.fa-plus')
                                ])
                            ])
                        ])
                    ]),
                    div('#todo-list.panel-body.row', [
                        ul('.list-group.col-xs-10.col-xs-offset-1', list.map((todoItem, index) =>
                            li('.todo-item.list-group-item.row', [
                                p('.col-xs-8.list-group-item-heading', [todoItem.title]),
                                button('.event-remove.col-xs-2.col-xs-offset-2.btn.btn-success.fa.fa-check', {
                                    attrs: {
                                        'data-id': index
                                    }
                                })
                            ])
                        ))
                    ])
                ])
            ])
        ])
    ])
}

function main({DOM}: So): Si {
    // event
    const eventAdd$ = DOM.select('.event-add').events('submit').do(ev => ev.preventDefault()).share();
    const eventInput$ = DOM.select('.event-input').events('input');
    const eventRemove$ = DOM.select('.event-remove').events('click');
    const inputText$ = eventInput$.map(ev => (ev.target as HTMLInputElement).value);
    const removeIndex$ = eventRemove$.map((ev: CycleDOMEvent) => Number((ev.ownerTarget as HTMLButtonElement).dataset['id']));

    // state
    const defaultState: TodoState = {
        inputValue: '',
        list: []
    };
    const todoState$ = Observable.merge(
        eventAdd$.withLatestFrom(
            inputText$,
            (_, title) => compose(
                over(lensProp('list'), append({ title, completed: false})),
                assoc('inputValue', '')
            )
        ),
        inputText$.map(text => assoc('inputValue', text)),
        removeIndex$.map(index => over(lensProp('list'), remove(index, 1)))
    ).scan((acc: TodoState, fn: StateAction) => fn(acc), defaultState).startWith(defaultState).do(console.log);

    return {
        DOM: todoState$.map((todoState) => renderDOM(todoState))
    }
}

run(main, {
    DOM: makeDOMDriver('#app-container')
});
