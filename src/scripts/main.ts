import 'rxjs/Rx';
import { Observable } from 'rxjs';
import { VNode } from '@cycle/dom';
import { DOMSource } from '@cycle/dom/rxjs-typings';
import { div, input, p, h2, button, span, i, ul, li, makeDOMDriver } from '@cycle/dom';
import { run } from '@cycle/rxjs-run';

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

function main({DOM}: So): Si {
    const eventClickAddItemButton$ = DOM.select('#new-todo button').events('click');
    const eventNewTodoItem$ = DOM.select('#new-todo input').events('change')
        .map(ev => (ev.target as HTMLInputElement).value);
    const newTodoItem$ = eventClickAddItemButton$.withLatestFrom(
        eventNewTodoItem$,
        (_, value) => {
            return value;
        }
    )

    const todoItemList$: Observable<todoItem[]> = newTodoItem$
        .scan<string, todoItem[]>((list: todoItem[], newItemTitle: string): todoItem[] => {
            list.push({ title: newItemTitle });
            return list;
        }, []).startWith([]);

    return {
        DOM: todoItemList$.map((todoItemList: todoItem[]) => {
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
                                ul('.list-group.col-xs-10.col-xs-offset-1', todoItemList.map(todoItem => {
                                    return li('.list-group-item.row', [
                                        input('.col-xs-1.col-xs-offset-1', {
                                            attrs: {
                                                type: 'checkbox'
                                            }
                                        }),
                                        p('.col-xs-8.list-group-item-heading', [todoItem.title])
                                    ])
                                })),
                                button('.btn.btn-success.col-xs-4.col-xs-offset-4.btn-lg', [
                                    i('.fa.fa-check')
                                ])
                            ])
                        ])
                    ])
                ])
            ])
        })
    }
}

run(main, {
    DOM: makeDOMDriver('#app-container')
});
