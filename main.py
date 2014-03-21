#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import webapp2
import en
import json
import cgi
import urllib
import httplib
from google.appengine.api import urlfetch

class MainHandler(webapp2.RequestHandler):
    def get(self):
        self.response.write("Welcome to Nodebox Linguistics")

class PluralHandler(webapp2.RequestHandler):
    def get(self):
        ret = {};
        ret['term'] = self.request.get('term')
        ret['result'] = en.noun.plural(ret['term'])
        self.response.write(json.dumps(ret))


class SingularHandler(webapp2.RequestHandler):
    def get(self):
        ret = {};
        ret['term'] = self.request.get('term')
        ret['result'] = en.noun.singular(ret['term'])
        self.response.write(json.dumps(ret))

class InfinitiveHandler(webapp2.RequestHandler):
    def get(self):
        ret = {};
        ret['term'] = self.request.get('term')
        ret['result'] = en.verb.infinitive(ret['term'])

        self.response.write(json.dumps(ret))

class NormalizeHandler(webapp2.RequestHandler):
    def get(self):
        ret = {};
        terms = str(en.sentence.tag(self.request.get('term'))).split(' ')
        ret['terms'] = []
        
        for t in terms:
            ret['terms'].append(t.split('/'))

        result = ''
        for t in ret['terms']:
            if(t[1][0:2] == 'NN'):
                result += str(en.noun.singular(t[0])) + ' '
            elif(t[1][0:2] == 'VB'):
                result += str(en.verb.infinitive(t[0])) + ' '
            else:
                result += str(t[0]) + ' '
        ret['result'] = result[0:-1]
        self.response.write(json.dumps(ret))    

class FetchHandler(webapp2.RequestHandler):
    def doProxy(self, p, urlmethod):
    
        location = ''
        page = self.response.out

        if p.get('url','') == '':
            page.write('page not found on query string')

        else:
            #print(urllib.quote(p['url'], ''))
            urls = p['url'].split('?')
            #print(urls[0] + urllib.quote(urls[1], '='))
            result = urlfetch.fetch(urls[0] + "?" + urllib.quote(urls[1], '='), method = urlmethod) 
            
            self.response.out.write(result.content)

    def get(self):
        self.doProxy(self.request.str_GET,urlfetch.GET)
        
    def post(self):
        self.doProxy(self.request.str_POST,urlfetch.POST)

app = webapp2.WSGIApplication([
    ('/', MainHandler),
    ('/fetch', FetchHandler),
    ('/plural', PluralHandler),
    ('/singular', SingularHandler),
    ('/infinitive', InfinitiveHandler),
    ('/normalize', NormalizeHandler)
], debug=True)
