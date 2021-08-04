interface IValueSet {
    _valueSet?:string;
    _valueSetStrength?: string;
    _valueSetRequired: boolean;
}

export interface ParsedProperty {
    _name: string;
    _type: string;
    _targetProfiles?: string[];
    _multiple?: boolean;
    _required?: boolean;
    _choice?: string;
    _properties?: ParsedProperty[];
    _valueSetStrength?: string;
    _valueSet?: string;
    _valueSetList?:Array<IValueSet>;
}
