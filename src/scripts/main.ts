import 'rxjs/Rx';
import { Observable } from 'rxjs';
import { VNode } from '@cycle/dom';
import { DOMSource } from '@cycle/dom/rxjs-typings';
import { CycleDOMEvent, div, input, p, h2, button, span, i, ul, li, makeDOMDriver } from '@cycle/dom';
import { run } from '@cycle/rxjs-run';
import { append, remove } from 'ramda';

type So = {
    DOM: DOMSource;
    props?: {};
}

type Si = {
    DOM: Observable<VNode>;
}

type todoItem = {
    title: string;
}

function renderDOM(todoItemList$: Observable<todoItem[]>): Observable<VNode> {
    return todoItemList$.map((todoItemList: todoItem[]) => {
        return div('.container', [
            div('.row', [
                div('.col-xs-8.col-xs-offset-2', [
                    div('.panel.panel-default', [
                        div('.panel-heading', [
                            h2('.panel-title', ['cyclejs todo'])
                        ]),
                        div('#new-todo.panel-body.row', [
                            div('.input-group.col-xs-8.col-xs-offset-2.input-group-lg', [
                                input('.form-control'),
                                span('.input-group-btn', [
                                    button('.btn.btn-success', [
                                        i('.fa.fa-plus')
                                    ])
                                ])
                            ])
                        ]),
                        div('#todo-list.panel-body.row', [
                            ul('.list-group.col-xs-10.col-xs-offset-1', todoItemList.map((todoItem, index) =>
                                li('.list-group-item.row', [
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
    });
}

function main({DOM}: So): Si {
    const eventAddItem$ = Observable.merge(
        DOM.select('#new-todo button').events('click'),
        DOM.select('#new-todo input').events('change')
    )
    const valueNewTodoItem$ = DOM.select('#new-todo input').events('change')
        .map(ev => (ev.target as HTMLInputElement).value);
    const eventClickRemoveItemButton$ = DOM.select('#todo-list ul li button').events('click')
        .map((ev: CycleDOMEvent) => (ev.ownerTarget as HTMLButtonElement).dataset['id']);

    const todoItemList$: Observable<todoItem[]> = Observable.merge(
        eventAddItem$.withLatestFrom(
            valueNewTodoItem$,
            (_, title) => append({ title })
        ),
        eventClickRemoveItemButton$.map(
            (index) => remove(Number(index), 1)
        ))
        .scan((todoList: todoItem[], reducer) => {
            return reducer(todoList);
        }, []).startWith([]);

    return {
        DOM: renderDOM(todoItemList$)
    }
}

run(main, {
    DOM: makeDOMDriver('#app-container')
});
