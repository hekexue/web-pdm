
import { model, Model, prop, modelAction, prop_mapObject, objectMap, applySnapshot } from 'mobx-keystone'
import { computed } from 'mobx'
import { without, union } from 'lodash'
import { TModel } from './model'
import { TModule } from './module'
import { TField } from './field'
import { TSys } from './sys'
import { TGraph } from './graph'
import { createData, createLinks } from '../graph/data'
import { renderModelTitle } from '../util/label'
// import StateStack from '../state-stack'
import { undoManager } from '../context'



function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}
function NewGuid() {
      return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function MapProp<T>() {
      return prop(() => objectMap<T>())
      // return prop_mapObject<(Map<string, T>)>(() => new Map())
}


@model("webpdm/RootStore")
export class RootInstance extends Model({
      sys: prop<TSys>(),
      Models: MapProp<TModel>(),
      Modules: MapProp<TModule>(),
      Fields: MapProp<TField>(),
      graph: prop<TGraph>(()=> new TGraph({}))

}) {
      @computed
      get moduleList() {
            return [...this.Modules.values()]
      }

      @computed
      get Nodes(): any {
            const data = createData(this)
            return data
      }

      @computed
      get edges(): any {
            return createLinks(this)
      }

      @modelAction
      findModelByName(name: string) {
            return [...this.Models.values()].find(a => a.name === name)
      }

      @modelAction
      renderModelTitle(model: TModel) {
            return renderModelTitle(model.label, this.sys.search, this.sys.showNameOrLabel, model.name)
      }

      @modelAction
      init({ modelData, moduleData }: { modelData: any, moduleData: any }) {

            let moduleHas: Record<string, string> = {}
            moduleData.forEach((module: any) => {
                  const key = NewGuid().toString()
                  this.Modules.set(key, new TModule({ id: key, label: module.name, name: module.key }))
                  moduleHas[module.key] = key
                  this.sys.expandedKeys.push(key)

            })
            let modelsKeys: string[] = []
            modelData.forEach((model: any) => {
                  const key = NewGuid().toString()
                  this.Models.set(key, new TModel({ id: key, label: model.name, name: model.key, moduleId: moduleHas[model.moduleKey] || '' }))
                  model.fields.forEach((field: any) => {
                        const _key = NewGuid().toString()
                        this.Fields.set(_key, new TField({ id: _key, typeMeta: field.typeMeta, label: field.name, name: field.key, type: field.type || 'string', modelId: key }))
                  })
                  modelsKeys.push(key)

            })
            this.sys.setCheckedKeys(modelsKeys)
      }
      @modelAction
      undo() {
      //     const current = StateStack.DataList.length - 1
      //     const state : any = StateStack.DataList[current - 1]
      //     const state = StateStack.undo()
      //     console.log(state)
      //     window.lockSnapshot = true
      undoManager.undo()
      //     this.sys.snapshot = false
      // alert('undo ' + state.sys.showNameOrLabel)
      //     applySnapshot(this,state)
      //     window.lockSnapshot = false

      }

      @modelAction
      redo() {
            // const state = StateStack.redo()
            // console.log(state)
            // window.lockSnapshot = true
            // applySnapshot(this,state)
            undoManager.redo()
      }
      @modelAction
      checkAllFun() {
            const currentModule = this.sys.currentModule
            const modelIds = currentModule ? this.Modules.get(currentModule)?.models?.map(a=> a.id) : [...this.Models.values()].map(a=>a.id)
            this.sys.checkedKeys = union(this.sys.checkedKeys, modelIds)
      }
      @modelAction
      checkAllCancleFun() {
            const currentModule = this.sys.currentModule
            // const models = [...this.Models.values()]
            const modelIds = this.Modules.get(currentModule)?.models?.map(a=> a.id)
            this.sys.checkedKeys = [...without([...this.sys.checkedKeys], ...(modelIds|| []))]
      }

      @modelAction
      setCheckedKeys = (keys: string[]) => {
          if(!this.sys.tabOrTree) {
              this.sys.checkedKeys = keys
          } else {
              const modelKeys = [...this.Models.values()].filter(a=> !this.sys.currentModule || a.moduleId === this.sys.currentModule).map(a=>a.id)
              const withoutKeys = without(modelKeys, ...keys)
              this.sys.checkedKeys = union(without(this.sys.checkedKeys, ...withoutKeys), keys)
          }
          
      }

}


export const createStore = () => {
      return new RootInstance({
            $modelId: 'webpdm',
            sys: new TSys({
                  isArrangeLayout: false,
                  layouting: true,
                  search: ''
            }),
            graph : new TGraph({})
      })
}


