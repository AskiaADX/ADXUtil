(function () {
var arrLiveRoutingInputName = [];
{% 
Dim liveRoutingIndex = 1
For liveRoutingIndex = 1 to CurrentQuestions.Count
    If (CurrentQuestions[liveRoutingIndex].IsLiveRoutingSource) Then
        %} arrLiveRoutingInputName.push('{%:= CurrentQuestions[liveRoutingIndex].InputCode %}');
{% EndIf
Next liveRoutingIndex
%}
window.arrLiveRoutingInputName = arrLiveRoutingInputName;
}());