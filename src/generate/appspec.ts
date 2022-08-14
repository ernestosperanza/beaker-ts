import algosdk from 'algosdk';

interface HintSpec { }

interface DeclaredSchemaValueSpec { 
    type: string // TODO: should be enum of uint64|bytes
    key: string // TODO: should be bytes
    desc: string
    static: boolean
}

interface DynamicSchemaValueSpec { 
    type: string // TODO: should be enum of uint64|bytes
    desc: string
    maxKeys: number
}

interface SchemaSpec {
    declared: {
        [key: string]: DeclaredSchemaValueSpec
    },
    dynamic: {
        [key: string]: DynamicSchemaValueSpec
    }
}


interface AppSchemaSpec {
    local: SchemaSpec 
    global: SchemaSpec 
}

export interface AppSpec {
    hints: HintSpec
    schema: AppSchemaSpec
    contract: algosdk.ABIContract
}