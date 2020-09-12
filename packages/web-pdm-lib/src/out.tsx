import React, { useEffect, useState, FunctionComponent } from 'react'
import { applySnapshot, onSnapshot, withoutUndo } from 'mobx-keystone'
import { useMst  } from './context'
import { observer } from 'mobx-react-lite'
import { Provider, createRootStore  } from './context'
import MSTPage from './components'
import { ModelConfig , ModuleConfig, FieldConfig, IComponentConfig } from './type/config'
export * from './type/config'
// import './style.scss'

export interface IWebPdmProps {
  models : ModelConfig[], 
  modules : ModuleConfig[], 
  erdkey : string, 
  className?: string, 
  style?: any, 
  height?: string | number,
  onIgnoreEdge?: (field: FieldConfig) => boolean,
  components: IComponentConfig
}

export const Page = observer<IWebPdmProps>(({ models, modules, erdkey, className, style, height, onIgnoreEdge, components }) => {
    const data = useMst()
    useEffect(() => {
      onSnapshot(data, snapshot => {
           sessionStorage.setItem('web-pdm' + erdkey, JSON.stringify(snapshot))
      })
      const localdata = sessionStorage.getItem('web-pdm'+ erdkey)
      if(!localdata) {
        withoutUndo(() => data.initData(models, modules))
      } else {
        const sdata = JSON.parse(localdata)
        sdata.sys.height = height
        withoutUndo(() => 
        {
          applySnapshot(data,sdata)
          data.sys.setOnIgnoreEdge(onIgnoreEdge)
          data.Ui.registComponents(components)
        }
          
          )
       
      }
      
  
    }, [])
    return <MSTPage className={className} style={style} />
  })

const WebPDM :FunctionComponent<IWebPdmProps>  = (props) => {
    const [rootStore] = useState(() => {
      return createRootStore({
        sys : {
          height: props.height,
          onIgnoreEdge: props.onIgnoreEdge
        },
        components : props.components
      })
    })
    return <Provider value={rootStore}>
     {rootStore && <Page {...props} />}
    </Provider>
}

export default WebPDM


