import 'rxjs/Rx';
import { Observable } from 'rxjs';
import { VNode } from '@cycle/dom';
import { DOMSource } from '@cycle/dom/rxjs-typings';
import { CycleDOMEvent, div, input, p, h2, button, span, i, ul, li, makeDOMDriver } from '@cycle/dom';
import { run } from '@cycle/rxjs-run';
import { append, remove, over, lensProp } from 'ramda';

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

type TodoState = {
    inputValue: string;
    list: TodoItem[];
}
const defaultTodoState = { inputValue: '', list: [] };

function renderDOM({inputValue, list}: TodoState): VNode {
    return div('.container', [
        div('.row', [
            div('.col-xs-8.col-xs-offset-2', [
                div('.panel.panel-default', [
                    div('.panel-heading', [
                        h2('.panel-title', ['cyclejs todo'])
                    ]),
                    div('#new-todo.panel-body.row', [
                        div('.input-group.col-xs-8.col-xs-offset-2.input-group-lg', [
                            input('.todo-title.form-control', {
                                attrs: {
                                    value: inputValue
                                }
                            }),
                            span('.input-group-btn', [
                                button('.add-todo.btn.btn-success', [
                                    i('.fa.fa-plus')
                                ])
                            ])
                        ])
                    ]),
                    div('#todo-list.panel-body.row', [
                        ul('.list-group.col-xs-10.col-xs-offset-1', list.map((todoItem, index) =>
                            li('.todo-item.list-group-item.row', [
                                p('.col-xs-8.list-group-item-heading', [todoItem.title]),
                                button('.col-xs-2.col-xs-offset-2.btn.btn-success.fa.fa-check', {
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
    // DOM event
    const eventClickAddTodoItem$ = DOM.select('#new-todo button.add-todo').events('click');
    const eventEnterPressTodoInput$ = DOM.select('#new-todo input.todo-title').events('keypress')
        .filter(ev => (ev as KeyboardEvent).keyCode == 13);
    const eventClickRemoveTodoItem$ = DOM.select('#todo-list ul li.todo-item button').events('click');

    const eventAddItem$ = Observable.merge(eventClickAddTodoItem$, eventEnterPressTodoInput$);
    const todoTitleValue$ = eventEnterPressTodoInput$.map(ev => (ev.target as HTMLInputElement).value);
    const todoItemIndexToRemove$ = eventClickRemoveTodoItem$
        .map((ev: CycleDOMEvent) => Number((ev.ownerTarget as HTMLButtonElement).dataset['id']));

    const todoStateInputValue$: Observable<string> = todoTitleValue$.combineLatest(
        eventAddItem$, (oldValue, _) => '');
    const todoStateList$: Observable<TodoItem[]> = Observable.merge(
        eventAddItem$.withLatestFrom(
            todoTitleValue$,
            (_, title) => append({ title, completed: false })
        ),
        todoItemIndexToRemove$.map(
            index => remove(index, 1)
        ))
        .scan((list: TodoItem[], reducer) => {
            return reducer(list);
        }, []).startWith([]);

    const todoState$: Observable<TodoState> = Observable.combineLatest(
        todoStateInputValue$, todoStateList$, (inputValue, list) => {
            return { inputValue, list }
        }).startWith(defaultTodoState);

    return {
        DOM: todoState$.map((todoState) => renderDOM(todoState))
    }
}

run(main, {
    DOM: makeDOMDriver('#app-container')
});
