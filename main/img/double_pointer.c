void change_by_single_pointer(int *ptr)
{
	(*ptr)++;
}


void change_ptr(int **ptr, int *target)
{
	*ptr = target;
}


int main()
{
	int *ptr;
	int a = 0, b = -1;

	ptr = &a;

	printf("*ptr : %d\n", *ptr); // print 0

	change_by_single_pointer(ptr); 	

	printf("*ptr : %d\n", *ptr); // print  1

	change_ptr(&ptr, &b);

	printf("*ptr : %d\n", *ptr); // print -1

}

// change_by_single_pointer 함수에서 포인터 변수 ptr은 a를 가리키고 있습니다.
// ptr 변수 자체를 ptr 주소가 가리키고 있는 변수의 값을 변경 시키는 것은 가능하지만, 
// ptr 변수 자체(int형 변수르 가리키는 포인터)의 값을 변경 시키는 것은 불가능합니다.

// ptr 변수 자체의 값을 변경 시키기 위해서는 ptr 변수의 주소를 넘겨 ptr 변수에 접근하여 변경 시켜야합니다.
// 그 예가 change_ptr함수에 나타나 있습니다. a 변수를 가리키고 있던 ptr 함수가 change_ptr 함수를 통해 
//  b 변수를 가리키게 됩니다.

// 책의 예제에 적용해서 생각해보겠습니다.
// 저의 추측으로 책의 예제에서 루트 노드를 가리키고 있는 어떠한 포인터 변수가 존재하고 있고
// 함수에 이중 포인터를 전달하는 경우에 함수밖에서 루트 노드를 가리키고 있는 어떠한 포인터 변수가
// 아예 다른 노드를 가리키게 만들고 싶은경우입니다.

// 삭제 함수의 경우 마지막 부분을 살펴보면 삭제되는 노드가 루트 노드일 경우 루트 노드를 변경해주어야 하겠지요
// 그런경우에 삭제 함수 밖에서 루트 노드를 가리키고 있던 변수가 삭제될 루트 노드를 대체할 다른 노드를 가리키게 됩니다.




