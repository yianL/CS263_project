# -*- coding: utf-8 -*-
# This was a test for ConceptNet 5.0 code. It won't work anymore, but it still needs to be adapted.

from conceptnet5.graph import *

def test_create_assertions_twice():
    g = get_graph()
    root = g.get_node('/')
    if not root:
        root = g._create_node(uri='/', score=1000, name='root')
    assert root['name'] == 'root'
    assert root['uri'] == '/'

    a1 = g.get_or_create_node(u'/assertion/[/relation/IsA/,/concept/en/dog/,/concept/en/animal/]')
    assert a1 == g.get_or_create_node(u'/assertion/[/relation/IsA/,/concept/en/dog/,/concept/en/animal/]')
    assert a1 == g.get_or_create_assertion(u'/relation/IsA',
        [u'/concept/en/dog', u'/concept/en/animal']
    )

    a2 = g.get_or_create_node(u'/assertion/[/relation/UsedFor/,/concept/zh_TW/枕頭/,/concept/zh_TW/睡覺/]')
    assert a2 == g.get_or_create_node(u'/assertion/[/relation/UsedFor/,/concept/zh_TW/枕頭/,/concept/zh_TW/睡覺/]')
    
    just1 = g.get_or_create_edge('justify', 0, a1, {'weight': 0.1})
    just2 = g.get_or_create_edge('justify', 0, a2, {'weight': 0.1})
    assert just1 == g.get_or_create_edge('justify', 0, a1, {'weight': 0.1})
    # TODO: clean up
    
