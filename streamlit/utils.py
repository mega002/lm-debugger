import streamlit as st
from elasticsearch import Elasticsearch
import streamlit.components.v1 as components
import urllib

vector_symbol = """<span role="img" aria-label="scan" class="anticon anticon-scan" style="color: #555;"><svg viewBox="64 64 896 896" focusable="false" data-icon="scan" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M136 384h56c4.4 0 8-3.6 8-8V200h176c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H196c-37.6 0-68 30.4-68 68v180c0 4.4 3.6 8 8 8zm512-184h176v176c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V196c0-37.6-30.4-68-68-68H648c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zM376 824H200V648c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v180c0 37.6 30.4 68 68 68h180c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm512-184h-56c-4.4 0-8 3.6-8 8v176H648c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h180c37.6 0 68-30.4 68-68V648c0-4.4-3.6-8-8-8zm16-164H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8z"></path></svg></span>"""
edit_symbol = """<span role="img" style="color:#ddd;"><svg width=".8em" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M421.7 220.3L188.5 453.4L154.6 419.5L158.1 416H112C103.2 416 96 408.8 96 400V353.9L92.51 357.4C87.78 362.2 84.31 368 82.42 374.4L59.44 452.6L137.6 429.6C143.1 427.7 149.8 424.2 154.6 419.5L188.5 453.4C178.1 463.8 165.2 471.5 151.1 475.6L30.77 511C22.35 513.5 13.24 511.2 7.03 504.1C.8198 498.8-1.502 489.7 .976 481.2L36.37 360.9C40.53 346.8 48.16 333.9 58.57 323.5L291.7 90.34L421.7 220.3zM492.7 58.75C517.7 83.74 517.7 124.3 492.7 149.3L444.3 197.7L314.3 67.72L362.7 19.32C387.7-5.678 428.3-5.678 453.3 19.32L492.7 58.75z"/></svg></span>"""
copy_symbol = """<span role="img" style="color:#ddd;"><svg width=".8em" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M64 464H288C296.8 464 304 456.8 304 448V384H352V448C352 483.3 323.3 512 288 512H64C28.65 512 0 483.3 0 448V224C0 188.7 28.65 160 64 160H128V208H64C55.16 208 48 215.2 48 224V448C48 456.8 55.16 464 64 464zM160 64C160 28.65 188.7 0 224 0H448C483.3 0 512 28.65 512 64V288C512 323.3 483.3 352 448 352H224C188.7 352 160 323.3 160 288V64zM224 304H448C456.8 304 464 296.8 464 288V64C464 55.16 456.8 48 448 48H224C215.2 48 208 55.16 208 64V288C208 296.8 215.2 304 224 304z"/></svg></span>"""


def _escape_latex(text):
    return text.replace('$', r'\$')


def copyable_value(layer, dim):
    value = f"L{layer}D{dim}"
    keywords_safe = urllib.parse.quote(st.session_state.get('keywords', '').encode('utf8'))
    return components.html(f"""
                              {vector_symbol} &nbsp;
                               <input readonly style="width:150px;" id="new_name_{value}" value=""/>
                               <input readonly
                               style="width:70px; font-size: inherit; font-family: inherit; 
                               border: none;" id='val_{value}' value="{value}"/> 
                                <a href="javascript:document.getElementById('val_{value}').select(); document.execCommand('copy');
                                                     window.parent.location.href = '?keywords={keywords_safe}&L={layer}&D={dim}&visualize=true';"
                                   target="_self">{copy_symbol}</a>
                                <a href="javascript:void(function(){{
                                                            var new_name = prompt('Rename the value ({value}): ');
                                                            document.getElementById('new_name_{value}').value = new_name;
                                                            localStorage.setItem('new_name_{value}', new_name);
                                                            var layer = {int(layer)};
                                                            var dim = {int(dim)};
                                                            var nameToFind = `new_name_L${{layer}}D${{dim}}`;
                                                            document.cookie = nameToFind + '=' + new_name; /* TODO: escape*/
                                                        }}())" target="_self">{edit_symbol}</a>
                                 <script>
                                 var new_name = null;
                                  var layer = {int(layer)};
                                  var dim = {int(dim)};
                                  var nameToFind = `new_name_L${{layer}}D${{dim}}`;
                                  // Search cookies
                                  var cookieData = document.cookie.split(';');
                                  
                                  for(var i = cookieData.length - 1; i >= 0; i--){{
                                    let pair = cookieData[i].split('=');
                                    let [k, v] = [pair[0], pair[1]];
                                    if(k.trim() == nameToFind){{
                                      new_name = v.trim();
                                      break;
                                    }}
                                  }}
                                 if(!new_name){{
                                    new_name = localStorage.getItem('new_name_{value}');
                                 }}
                                 document.getElementById("new_name_{value}").value = new_name;
                                 </script>
                                   """, height=30)


def apply_styling():
    st.markdown("""
        <style>
        .value_font {
            font-size:20px !important;
            font-weight: bold;
        }
        
        .token-font {
            color: #078e9e;
            font-weight: bold;
        }
        </style>
    """, unsafe_allow_html=True)
